import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { extrairPlaceholders, VARIAVEIS_DISPONIVEIS, catalogoPorChave } from '../domain/placeholders';
import { TEMPLATES_PADRAO } from '../domain/templates-padrao';

const uploadDir = path.resolve(process.cwd(), 'storage', 'templates');

@Injectable()
export class TemplatesDocumentoService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.garantirPadroes('system');
      await this.vincularModelosDre('system');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      console.warn(`Templates padrão não foram semeados: ${message}`);
    }
  }

  private async vincularModelosDre(usuarioId: string) {
    const pasta = path.resolve(process.cwd(), '..', '..', 'docs', 'dre');
    const modelos: Array<[string, string]> = [
      ['EDITAL_PRINCIPAL', '01_Edital_Principal.pdf'],
      ['ANEXO_I', '02_Anexo_I_Grupos_Formais.pdf'],
      ['ANEXO_II', '03_Anexo_II_Grupos_Informais.pdf'],
      ['ANEXO_III', '04_Anexo_III_Fornecedores_Individuais.pdf'],
      ['ANEXO_IV', '05_Anexo_IV_Empreendimento_Familiar_Rural.pdf'],
      ['ANEXO_V', '06_Anexo_V_Unidades_Escolares.pdf'],
      ['ANEXO_VI', '07_Anexo_VI_Resultado_Chamada_Publica.pdf'],
      ['ANEXO_VII', '08_Anexo_VII_Minuta_Contrato.pdf'],
    ];
    if (!fs.existsSync(pasta)) return;
    fs.mkdirSync(uploadDir, { recursive: true });
    for (const [tipo, nome] of modelos) {
      const origem = path.join(pasta, nome);
      if (!fs.existsSync(origem)) continue;
      const template = await this.prisma.templateDocumento.findFirst({ where: { tipo: tipo as any, deletedAt: null }, orderBy: { id: 'asc' } });
      if (!template || template.formato === 'PDF' && template.arquivoBase) continue;
      const destino = path.join(uploadDir, `dre-${nome}`);
      await fs.promises.copyFile(origem, destino);
      const versao = template.versaoAtual + 1;
      await this.prisma.templateDocumento.update({ where: { id: template.id }, data: { formato: 'PDF', arquivoBase: path.relative(process.cwd(), destino), versaoAtual: versao, updatedBy: usuarioId } });
      await this.criarVersao(template.id, versao, template.titulo, template.conteudo, 'PDF', path.relative(process.cwd(), destino), undefined, undefined, usuarioId, `Modelo oficial ${nome}`);
    }
  }

  listarVariaveis() {
    return VARIAVEIS_DISPONIVEIS;
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
    for (const modelo of TEMPLATES_PADRAO) {
      const existente = await this.prisma.templateDocumento.findFirst({
        where: { tipo: modelo.tipo as any, deletedAt: null, titulo: modelo.titulo },
      });
      if (existente) continue;
      await this.criar({
        tipo: modelo.tipo,
        numeroAnexo: modelo.numeroAnexo ?? undefined,
        titulo: modelo.titulo,
        descricao: modelo.descricao,
        ordem: modelo.ordem,
        formato: 'HTML',
        conteudo: modelo.conteudo,
        ativo: true,
      }, usuarioId);
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
  }, usuarioId: string) {
    this.assertFormato(dto.formato || 'HTML');
    if (dto.conteudo) this.assertPlaceholders(dto.conteudo);
    const template = await this.prisma.templateDocumento.create({
      data: {
        tipo: dto.tipo as any,
        numeroAnexo: dto.numeroAnexo ?? null,
        titulo: dto.titulo,
        descricao: dto.descricao,
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
    const novaVersao = conteudoMudou || vigenciaMudou || dto.arquivoBase;
    const versaoAtual = novaVersao ? atual.versaoAtual + 1 : atual.versaoAtual;

    await this.prisma.templateDocumento.update({
      where: { id },
      data: {
        ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
        ...(dto.numeroAnexo !== undefined ? { numeroAnexo: dto.numeroAnexo } : {}),
        ...(dto.titulo !== undefined ? { titulo: dto.titulo } : {}),
        ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
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
      formato = 'PDF';
      // PDFs de formulário são preservados como fonte visual; não os achatamos em HTML.
      conteudo = atual.conteudo;
    } else if (ext === '.docx') {
      formato = 'DOCX';
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
    if (!item.arquivoBase) throw new NotFoundException('Template sem arquivo-base.');
    const absoluto = path.isAbsolute(item.arquivoBase) ? item.arquivoBase : path.resolve(process.cwd(), item.arquivoBase);
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
