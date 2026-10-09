import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { extrairPlaceholders, VARIAVEIS_DISPONIVEIS, catalogoPorChave } from '../domain/placeholders';
import { TEMPLATES_PADRAO } from '../domain/templates-padrao';
import { MODELOS_DRE } from '../domain/templates-dre';

const uploadDir = path.resolve(process.cwd(), 'storage', 'templates');

@Injectable()
export class TemplatesDocumentoService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.garantirPadroes('system');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      console.warn(`Templates padrão não foram semeados: ${message}`);
    }
  }

  listarVariaveis() {
    return VARIAVEIS_DISPONIVEIS;
  }

  async anexosPadrao() {
    const modelos = await this.listar({ ativo: 'true' });
    const selecionados = new Map<string, typeof modelos[number]>();
    for (const modelo of modelos) {
      const chave = `${modelo.tipo}:${modelo.finalidade}:${modelo.perfilFornecedor || ''}`;
      if (!selecionados.has(chave)) selecionados.set(chave, modelo);
    }
    return [...selecionados.values()].map((modelo, ordem) => ({
      tipo: modelo.tipo, titulo: modelo.titulo, ordem, incluido: true,
      templateId: modelo.id, templateVersaoId: modelo.versoes[0]?.id,
    }));
  }

  async listar(query: { search?: string; tipo?: string; ativo?: string }) {
    const where: Prisma.TemplateDocumentoWhereInput = {
      deletedAt: null,
      ...(query.tipo ? { tipo: query.tipo as any } : {}),
      ...(query.ativo === 'true' ? { ativo: true } : {}),
      ...(query.ativo === 'false' ? { ativo: false } : {}),
      ...(query.search ? { titulo: { contains: query.search } } : {}),
    };
    return this.prisma.templateDocumento.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
      include: { versoes: { orderBy: { numero: 'desc' }, take: 1 } },
    });
  }

  async buscar(id: string) {
    const item = await this.prisma.templateDocumento.findFirst({
      where: { id, deletedAt: null },
      include: { versoes: { orderBy: { numero: 'desc' } }, campos: { orderBy: { ordem: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Template não encontrado.');
    return item;
  }

  async garantirPadroes(usuarioId: string) {
    for (const modelo of MODELOS_DRE) {
      const semeado = await this.prisma.templateDocumento.findUnique({ where: { codigoModelo: modelo.arquivo } });
      if (semeado) continue;
      const legado = TEMPLATES_PADRAO.find(item => item.tipo === modelo.tipo);
      let existente = await this.prisma.templateDocumento.findFirst({
        where: { tipo: modelo.tipo as any, deletedAt: null, titulo: modelo.titulo },
      });
      if (existente && existente.conteudo !== legado?.conteudo) {
        await this.prisma.templateDocumento.update({ where: { id: existente.id }, data: { codigoModelo: modelo.arquivo } });
        continue;
      }
      if (legado && ['EDITAL', 'PROJETO_VENDA'].includes(modelo.finalidade)) {
        existente = await this.prisma.templateDocumento.findFirst({
          where: { tipo: modelo.tipo as any, titulo: legado.titulo, conteudo: legado.conteudo, deletedAt: null },
        });
      }
      const dados = {
        tipo: modelo.tipo, titulo: modelo.titulo, finalidade: modelo.finalidade,
        perfilFornecedor: modelo.perfilFornecedor, ordem: modelo.ordem,
        descricao: `Texto editável baseado em docs/dre/${modelo.arquivo}.`,
        formato: 'HTML', conteudo: modelo.conteudo,
      };
      if (existente) {
        await this.atualizar(existente.id, dados, usuarioId);
        await this.prisma.templateDocumento.update({ where: { id: existente.id }, data: { codigoModelo: modelo.arquivo } });
        continue;
      }
      const criado = await this.criar({
        ...dados,
        numeroAnexo: modelo.tipo === 'EDITAL_PRINCIPAL' ? undefined : ['ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_V', 'ANEXO_VI', 'ANEXO_VII'].indexOf(modelo.tipo) + 1,
        ativo: true,
      }, usuarioId);
      await this.prisma.templateDocumento.update({ where: { id: criado.id }, data: { codigoModelo: modelo.arquivo } });
    }
  }

  async criar(dto: {
    tipo: string;
    numeroAnexo?: number;
    titulo: string;
    descricao?: string;
    ordem?: number;
    formato?: string;
    conteudo?: string;
    vigenciaInicio?: string;
    vigenciaFim?: string;
    ativo?: boolean;
    finalidade?: string;
    perfilFornecedor?: string;
  }, usuarioId: string) {
    this.assertFormato(dto.formato || 'HTML');
    if (dto.conteudo) this.assertPlaceholders(dto.conteudo);
    const template = await this.prisma.templateDocumento.create({
      data: {
        tipo: dto.tipo as any,
        numeroAnexo: dto.numeroAnexo ?? null,
        titulo: dto.titulo,
        descricao: dto.descricao,
        finalidade: dto.finalidade || 'EDITAL',
        perfilFornecedor: dto.perfilFornecedor || null,
        ordem: dto.ordem ?? 0,
        formato: (dto.formato || 'HTML') as any,
        conteudo: dto.conteudo,
        ativo: dto.ativo ?? true,
        vigenciaInicio: dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : null,
        vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : null,
        versaoAtual: 1,
        createdBy: usuarioId,
        updatedBy: usuarioId,
      },
    });
    await this.criarVersao(template.id, 1, dto.titulo, dto.conteudo, dto.formato || 'HTML', null, dto.vigenciaInicio, dto.vigenciaFim, usuarioId, 'Versão inicial');
    await this.sincronizarCampos(template.id, dto.conteudo || '', dto.tipo);
    return this.buscar(template.id);
  }

  async atualizar(id: string, dto: Record<string, any>, usuarioId: string) {
    const atual = await this.buscar(id);
    if (dto.conteudo) this.assertPlaceholders(dto.conteudo);
    if (dto.formato) this.assertFormato(dto.formato);
    const conteudoMudou = dto.conteudo !== undefined && dto.conteudo !== atual.conteudo;
    const vigenciaMudou = dto.vigenciaInicio !== undefined || dto.vigenciaFim !== undefined;
    const novaVersao = conteudoMudou || vigenciaMudou || dto.arquivoBase || (dto.formato !== undefined && dto.formato !== atual.formato) || (dto.titulo !== undefined && dto.titulo !== atual.titulo);
    const versaoAtual = novaVersao ? atual.versaoAtual + 1 : atual.versaoAtual;

    await this.prisma.templateDocumento.update({
      where: { id },
      data: {
        ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
        ...(dto.numeroAnexo !== undefined ? { numeroAnexo: dto.numeroAnexo } : {}),
        ...(dto.titulo !== undefined ? { titulo: dto.titulo } : {}),
        ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
        ...(dto.finalidade !== undefined ? { finalidade: dto.finalidade } : {}),
        ...(dto.perfilFornecedor !== undefined ? { perfilFornecedor: dto.perfilFornecedor || null } : {}),
        ...(dto.ordem !== undefined ? { ordem: dto.ordem } : {}),
        ...(dto.formato !== undefined ? { formato: dto.formato } : {}),
        ...(dto.conteudo !== undefined ? { conteudo: dto.conteudo } : {}),
        ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
        ...(dto.vigenciaInicio !== undefined ? { vigenciaInicio: dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : null } : {}),
        ...(dto.vigenciaFim !== undefined ? { vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : null } : {}),
        versaoAtual,
        updatedBy: usuarioId,
      },
    });

    if (novaVersao) {
      await this.criarVersao(
        id,
        versaoAtual,
        dto.titulo || atual.titulo,
        dto.conteudo ?? atual.conteudo,
        dto.formato || atual.formato,
        atual.arquivoBase,
        dto.vigenciaInicio,
        dto.vigenciaFim,
        usuarioId,
        'Atualização do template',
      );
      await this.sincronizarCampos(id, dto.conteudo ?? atual.conteudo ?? '', dto.tipo || atual.tipo);
    }
    return this.buscar(id);
  }

  async duplicar(id: string, usuarioId: string) {
    const atual = await this.buscar(id);
    return this.criar({
      tipo: atual.tipo,
      numeroAnexo: atual.numeroAnexo ?? undefined,
      titulo: `${atual.titulo} (cópia)`,
      descricao: atual.descricao ?? undefined,
      finalidade: atual.finalidade,
      perfilFornecedor: atual.perfilFornecedor ?? undefined,
      ordem: atual.ordem,
      formato: atual.formato,
      conteudo: atual.conteudo ?? undefined,
      ativo: false,
    }, usuarioId);
  }

  async alterarStatus(id: string, ativo: boolean, usuarioId: string) {
    await this.buscar(id);
    return this.prisma.templateDocumento.update({ where: { id }, data: { ativo, updatedBy: usuarioId } });
  }

  async remover(id: string, usuarioId: string) {
    await this.buscar(id);
    const usados = await this.prisma.editalAnexo.count({
      where: { templateId: id, documento: { geracoes: { some: { status: 'SUCESSO' } } } },
    });
    if (usados > 0) {
      throw new BadRequestException('Template vinculado a edital já gerado não pode ser excluído. Inative-o ou crie uma nova versão.');
    }
    await this.prisma.editalAnexo.deleteMany({ where: { templateId: id } });
    return this.prisma.templateDocumento.update({ where: { id }, data: { deletedAt: new Date(), ativo: false, updatedBy: usuarioId } });
  }

  async enviarArquivo(id: string, file: Express.Multer.File, usuarioId: string) {
    const atual = await this.buscar(id);
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.html', '.htm', '.txt', '.docx', '.pdf'].includes(ext)) {
      throw new BadRequestException('Envie um arquivo HTML, TXT, DOCX ou PDF.');
    }
    fs.mkdirSync(uploadDir, { recursive: true });
    const destino = path.join(uploadDir, `${Date.now()}-${path.basename(file.originalname).replace(/[<>:"/\\|?*]+/g, '')}`);
    await fs.promises.rename(file.path, destino).catch(async () => {
      await fs.promises.copyFile(file.path, destino);
    });

    let conteudo = atual.conteudo;
    let formato = atual.formato;
    if (ext === '.pdf') {
      formato = atual.conteudo?.trim() && ['HTML', 'TEXTO'].includes(atual.formato) ? atual.formato : 'PDF';
      // PDFs de formulário são preservados como fonte visual; não os achatamos em HTML.
      conteudo = atual.conteudo;
    } else if (ext === '.docx') {
      formato = atual.conteudo?.trim() && ['HTML', 'TEXTO'].includes(atual.formato) ? atual.formato : 'DOCX';
      // O DOCX original é a fonte do template. Não o achatamos em HTML;
      // o arquivo é anexado na geração para preservar sua formatação.
      conteudo = atual.conteudo;
    } else {
      formato = ext === '.txt' ? 'TEXTO' : 'HTML';
      conteudo = await fs.promises.readFile(destino, 'utf8');
    }
    if (conteudo) this.assertPlaceholders(conteudo);
    const versaoAtual = atual.versaoAtual + 1;
    await this.prisma.templateDocumento.update({
      where: { id },
      data: { arquivoBase: path.relative(process.cwd(), destino), conteudo, formato: formato as any, versaoAtual, updatedBy: usuarioId },
    });
    await this.criarVersao(id, versaoAtual, atual.titulo, conteudo, formato, path.relative(process.cwd(), destino), undefined, undefined, usuarioId, `Arquivo ${file.originalname}`);
    await this.sincronizarCampos(id, conteudo || '', atual.tipo);
    return this.buscar(id);
  }

  async caminhoArquivo(id: string) {
    const item = await this.buscar(id);
    const modeloDre = item.codigoModelo && MODELOS_DRE.some(m => m.arquivo === item.codigoModelo);
    const referencia = modeloDre ? [path.resolve(process.cwd(), '..', '..', 'docs', 'dre', item.codigoModelo!), path.resolve(process.cwd(), 'docs', 'dre', item.codigoModelo!)].find(p => fs.existsSync(p)) : undefined;
    if (!item.arquivoBase && !referencia) throw new NotFoundException('Template sem arquivo-base.');
    const absoluto = item.arquivoBase ? (path.isAbsolute(item.arquivoBase) ? item.arquivoBase : path.resolve(process.cwd(), item.arquivoBase)) : referencia!;
    if (!fs.existsSync(absoluto)) throw new NotFoundException('Arquivo-base não encontrado.');
    return { caminho: absoluto, nome: path.basename(absoluto) };
  }

  private assertFormato(formato: string) {
    if (!['HTML', 'DOCX', 'TEXTO', 'PDF'].includes(formato)) throw new BadRequestException('Formato de template não suportado.');
  }

  private assertPlaceholders(conteudo: string) {
    const invalidos = extrairPlaceholders(conteudo).filter((chave) => !catalogoPorChave(chave));
    if (invalidos.length) throw new BadRequestException(`Placeholders inválidos: ${invalidos.join(', ')}.`);
  }

  private async criarVersao(
    templateId: string,
    numero: number,
    titulo: string,
    conteudo: string | null | undefined,
    formato: string,
    arquivoBase: string | null | undefined,
    vigenciaInicio: string | null | undefined,
    vigenciaFim: string | null | undefined,
    usuarioId: string,
    observacao: string,
  ) {
    await this.prisma.templateVersao.create({
      data: {
        templateId,
        numero,
        titulo,
        conteudo: conteudo ?? null,
        formato: formato as any,
        arquivoBase: arquivoBase ?? null,
        vigenciaInicio: vigenciaInicio ? new Date(vigenciaInicio) : null,
        vigenciaFim: vigenciaFim ? new Date(vigenciaFim) : null,
        observacao,
        createdBy: usuarioId,
      },
    });
  }

  private async sincronizarCampos(templateId: string, conteudo: string, tipo: string) {
    const chaves = extrairPlaceholders(conteudo);
    await this.prisma.campoTemplate.deleteMany({ where: { templateId } });
    if (!chaves.length) return;
    await this.prisma.campoTemplate.createMany({
      data: chaves.map((chave, ordem) => {
        const catalogo = catalogoPorChave(chave);
        return {
          templateId,
          chave,
          rotulo: catalogo?.rotulo || chave,
          tipo: catalogo?.tipo || 'texto',
          obrigatorio: catalogo?.obrigatorio || false,
          valorPadrao: catalogo?.valorPadrao,
          repetitivo: catalogo?.repetitivo || false,
          anexoTipo: tipo as any,
          ordem,
        };
      }),
    });
  }
}
