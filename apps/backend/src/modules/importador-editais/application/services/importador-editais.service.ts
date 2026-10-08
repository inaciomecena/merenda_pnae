import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { StatusImportacao, StatusItemEdital } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { ImportacoesRepository } from '../repositories/importacoes.repository';
import { ParserService } from './parser.service';
import { ConfirmarImportacaoDto } from '../../presentation/dto/confirmar-importacao.dto';
import { CreateImportacaoPdfDto } from '../../presentation/dto/create-importacao-pdf.dto';
import { UpdateImportacaoEditalDto } from '../../presentation/dto/update-importacao-edital.dto';

const docsDir = path.resolve(process.cwd(), '..', '..', 'docs');

@Injectable()
export class ImportadorEditaisService implements OnModuleInit {
  private readonly logger = new Logger(ImportadorEditaisService.name);

  constructor(
    private readonly repository: ImportacoesRepository,
    private readonly parserService: ParserService,
  ) {}

  async onModuleInit() {
    try {
      await this.sincronizarPdfsDaPastaDocs(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.warn(`Falha ao sincronizar PDFs da pasta docs na inicialização: ${message}`);
    }
  }

  async registrarUpload(file: Express.Multer.File, dto: CreateImportacaoPdfDto) {
    const importacao = await this.repository.createImportLog({
      arquivoNome: dto.nomeArquivo?.trim() || file.originalname,
      arquivoCaminho: file.path,
      origem: 'UPLOAD',
      status: dto.processarAutomaticamente ? StatusImportacao.PROCESSANDO : StatusImportacao.AGUARDANDO_PROCESSAMENTO,
      createdBy: 'importador-editais',
    });

    if (dto.processarAutomaticamente) {
      return this.processarImportacao(importacao.id, true);
    }

    return importacao;
  }

  async listarImportacoes(query: { page?: number; limit?: number; status?: string }) {
    await this.sincronizarDocs(false);
    return this.repository.list(query);
  }

  async sincronizarDocs(processarAutomaticamente = false) {
    return this.sincronizarPdfsDaPastaDocs(processarAutomaticamente);
  }

  async buscarImportacao(id: string) {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException('Importação não encontrada.');
    }

    return item;
  }

  async processarImportacao(id: string, reprocessar = false) {
    const importacao = await this.buscarImportacao(id);
    const processedStatuses = new Set<StatusImportacao>([
      StatusImportacao.PROCESSADO,
      StatusImportacao.PENDENTE_CONFERENCIA,
      StatusImportacao.CONFIRMADO,
    ]);

    if (!reprocessar && processedStatuses.has(importacao.status)) {
      return importacao;
    }

    if (!fs.existsSync(importacao.arquivoCaminho)) {
      await this.repository.updateImportLog(importacao.id, {
        status: StatusImportacao.ERRO,
        mensagemErro: 'Arquivo PDF não encontrado no caminho salvo.',
        updatedBy: 'importador-editais',
      });

      throw new BadRequestException('Arquivo PDF não encontrado no caminho salvo.');
    }

    const startedAt = Date.now();
    await this.repository.updateImportLog(importacao.id, {
      status: StatusImportacao.PROCESSANDO,
      mensagemErro: null,
      updatedBy: 'importador-editais',
    });

    try {
      const buffer = await fs.promises.readFile(importacao.arquivoCaminho);
      const parsed = await this.parserService.parse(buffer, importacao.arquivoNome);
      const municipio = await this.repository.resolveMunicipioByName(parsed.municipio);
      const escola = await this.repository.resolveEscolaByName(parsed.escola, municipio?.id);
      const edital = await this.repository.upsertEditalFromImport(importacao.id, importacao.editalId, {
        numero: parsed.numero || this.fallbackNumero(importacao.arquivoNome),
        ano: parsed.ano || new Date().getFullYear(),
        titulo: parsed.titulo,
        descricao: parsed.observacoes,
        objeto: parsed.objeto,
        observacoes: parsed.observacoes,
        arquivoFonte: importacao.arquivoCaminho,
        municipioId: municipio?.id,
        escolaId: escola?.id,
        dataPublicacao: parsed.data ? new Date(parsed.data) : undefined,
      });

      const hasPendingItems = parsed.itens.some((item) => item.pendenteConferencia);

      await this.repository.createEditalItems(
        edital.id,
        parsed.itens.map((item) => ({
          editalId: edital.id,
          numeroItem: item.numeroItem,
          produtoOriginal: item.produtoOriginal,
          especificacao: item.especificacao,
          quantidade: item.quantidade ?? null,
          unidade: item.unidade ?? null,
          precoUnitario: item.precoUnitario ?? null,
          valorTotal: item.valorTotal ?? null,
          observacoes: item.observacoes,
          status: item.pendenteConferencia ? StatusItemEdital.PENDENTE_CONFERENCIA : StatusItemEdital.IMPORTADO,
          pendenteEdicao: item.pendenteConferencia,
          importadoAutomaticamente: true,
          createdBy: 'importador-editais',
        })),
      );

      await this.repository.updateImportLog(importacao.id, {
        editalId: edital.id,
        tituloExtraido: parsed.titulo,
        numeroExtraido: parsed.numero,
        anoExtraido: parsed.ano,
        municipioNome: parsed.municipio,
        escolaNome: parsed.escola,
        objeto: parsed.objeto,
        resumo: parsed.observacoes,
        quantidadeItens: parsed.itens.length,
        tempoProcessamentoMs: Date.now() - startedAt,
        processadoEm: new Date(),
        status: hasPendingItems ? StatusImportacao.PENDENTE_CONFERENCIA : StatusImportacao.PROCESSADO,
        updatedBy: 'importador-editais',
      });

      return this.buscarImportacao(importacao.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF.';
      await this.repository.updateImportLog(importacao.id, {
        status: StatusImportacao.ERRO,
        mensagemErro: message,
        tempoProcessamentoMs: Date.now() - startedAt,
        updatedBy: 'importador-editais',
      });

      throw error;
    }
  }

  async confirmarImportacao(id: string, dto: ConfirmarImportacaoDto) {
    const importacao = await this.buscarImportacao(id);
    if (!importacao.editalId) {
      throw new BadRequestException('A importação ainda não gerou um edital para confirmação.');
    }

    return this.repository.confirmImportacao(id, importacao.editalId, dto.itens);
  }

  async editarEdital(id: string, dto: UpdateImportacaoEditalDto) {
    const importacao = await this.buscarImportacao(id);

    if (importacao.status === StatusImportacao.CONFIRMADO) {
      throw new BadRequestException('Importação já confirmada não pode ser editada.');
    }

    if (!importacao.editalId) {
      throw new BadRequestException('A importação ainda não gerou um edital para edição.');
    }

    const editalData: Record<string, any> = { updatedBy: 'importador-editais' };

    if (dto.numero !== undefined) editalData.numero = dto.numero;
    if (dto.ano !== undefined) editalData.ano = dto.ano;
    if (dto.titulo !== undefined) editalData.titulo = dto.titulo;
    if (dto.descricao !== undefined) editalData.descricao = dto.descricao;
    if (dto.objeto !== undefined) editalData.objeto = dto.objeto;
    if (dto.escolaId !== undefined) editalData.escolaId = dto.escolaId || null;
    if (dto.municipioId !== undefined) editalData.municipioId = dto.municipioId || null;
    if (dto.dataPublicacao !== undefined) editalData.dataPublicacao = dto.dataPublicacao ? new Date(dto.dataPublicacao) : null;

    await this.repository.updateEdital(importacao.editalId, editalData);

    // Atualizar também os campos desnormalizados no ImportLog
    const importLogData: Record<string, any> = { updatedBy: 'importador-editais' };
    if (dto.titulo !== undefined) importLogData.tituloExtraido = dto.titulo;
    if (dto.numero !== undefined) importLogData.numeroExtraido = dto.numero;
    if (dto.ano !== undefined) importLogData.anoExtraido = dto.ano;

    if (Object.keys(importLogData).length > 1) {
      await this.repository.updateImportLog(id, importLogData);
    }

    return this.buscarImportacao(id);
  }

  private async sincronizarPdfsDaPastaDocs(processarAutomaticamente: boolean) {
    if (!fs.existsSync(docsDir)) {
      return { encontrados: 0, criados: 0, processados: 0, importacoes: [] };
    }

    const files = (await fs.promises.readdir(docsDir, { encoding: 'utf8' }))
      .filter((file) => file.toLowerCase().endsWith('.pdf'))
      .map((file) => ({
        nome: file,
        caminho: path.join(docsDir, file),
      }));

    const importacoes = [];
    let criados = 0;
    let processados = 0;

    for (const file of files) {
      const existente = await this.repository.findByFilePath(file.caminho);
      if (existente) {
        importacoes.push(existente);
        continue;
      }

      const created = await this.repository.createImportLog({
        arquivoNome: file.nome,
        arquivoCaminho: file.caminho,
        origem: 'DOCS',
        status: StatusImportacao.AGUARDANDO_PROCESSAMENTO,
        createdBy: 'importador-editais',
      });
      criados += 1;

      if (processarAutomaticamente) {
        importacoes.push(await this.processarImportacao(created.id, true));
        processados += 1;
      } else {
        importacoes.push(created);
      }
    }

    return { encontrados: files.length, criados, processados, importacoes };
  }

  private fallbackNumero(fileName: string): string {
    const match = fileName.match(/(\d{1,4}[ -_]?\d{4}|\d{1,4}\/\d{4})/);
    return match?.[1]?.replace(/[ _-]/g, '/') || `AUTO-${Date.now()}`;
  }
}
