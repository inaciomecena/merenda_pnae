import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { analisarTextoEdital, PaginaTexto } from '../domain/engenharia-reversa';
import { STATUS_REVISAO } from '../domain/placeholders';
import { ComposicaoEditalService } from './composicao-edital.service';
import { TemplatesDocumentoService } from './templates-documento.service';
import { prepararDadosEdital } from '../domain/preenchimento-importacao';

@Injectable()
export class EngenhariaReversaImportacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly composicao: ComposicaoEditalService,
    private readonly templates: TemplatesDocumentoService,
  ) {}

  async prepararEdital(importacaoId: string) {
    const importacao = await this.prisma.importLog.findFirst({
      where: { id: importacaoId, deletedAt: null },
      include: {
        estrutura: true,
        edital: { include: { documento: true, escolasVinculadas: true, itens: { where: { deletedAt: null }, orderBy: { numeroItem: 'asc' } } } },
      },
    });
    if (!importacao || importacao.edital?.deletedAt) throw new NotFoundException('Importação não encontrada.');
    if (importacao.status === 'PROCESSANDO') throw new BadRequestException('Aguarde o processamento terminar para carregar os dados.');
    if (!importacao.edital) throw new BadRequestException('Processe a importação antes de carregar os dados do edital.');
    const estrutura = importacao.estrutura ? await this.obter(importacaoId) : await this.montar(importacaoId);
    const dados = prepararDadosEdital(importacao, estrutura);
    dados.documento.anexos = await this.templates.anexosPadrao();
    return dados;
  }

  async montar(importacaoId: string, opcoes?: { buffer?: Buffer; editalId?: string }) {
    const importacao = await this.prisma.importLog.findFirst({ where: { id: importacaoId, deletedAt: null } });
    if (!importacao) throw new NotFoundException('Importação não encontrada.');
    const buffer = opcoes?.buffer || await fs.promises.readFile(importacao.arquivoCaminho);
    const extraido = await this.lerPdf(buffer);
    const analise = analisarTextoEdital(extraido.texto, extraido.paginas);
    const editalId = opcoes?.editalId || importacao.editalId;

    const estrutura = await this.prisma.importacaoEstrutura.upsert({
      where: { importLogId: importacaoId },
      update: {
        editalId,
        textoExtraido: extraido.texto,
        secoesJson: JSON.stringify(analise.secoes),
        anexosJson: JSON.stringify(analise.anexos),
        tabelasJson: JSON.stringify(analise.tabelas),
        assinaturasJson: JSON.stringify(analise.assinaturas),
        confiancaGeral: analise.confiancaGeral,
        parametrizado: analise.parametrizado,
      },
      create: {
        importLogId: importacaoId,
        editalId,
        textoExtraido: extraido.texto,
        secoesJson: JSON.stringify(analise.secoes),
        anexosJson: JSON.stringify(analise.anexos),
        tabelasJson: JSON.stringify(analise.tabelas),
        assinaturasJson: JSON.stringify(analise.assinaturas),
        confiancaGeral: analise.confiancaGeral,
        parametrizado: analise.parametrizado,
      },
    });
    await this.prisma.importacaoCampo.deleteMany({ where: { estruturaId: estrutura.id } });
    if (analise.campos.length) {
      await this.prisma.importacaoCampo.createMany({
        data: analise.campos.map((campo) => ({
          estruturaId: estrutura.id,
          chave: campo.chave,
          rotulo: campo.rotulo,
          valor: campo.valor,
          valorExtraido: campo.valorExtraido,
          trecho: campo.trecho,
          origem: STATUS_REVISAO.EXTRAIDO,
          confianca: campo.confianca,
          paginaOrigem: campo.paginaOrigem,
          secao: campo.secao,
          editavel: campo.editavel,
          sensivel: campo.sensivel,
          statusRevisao: campo.statusRevisao,
        })),
      });
    }
    return this.obter(importacaoId);
  }

  async obter(importacaoId: string) {
    const estrutura = await this.prisma.importacaoEstrutura.findUnique({
      where: { importLogId: importacaoId },
      include: { campos: { orderBy: { chave: 'asc' } }, importLog: true },
    });
    if (!estrutura || estrutura.importLog.deletedAt) throw new NotFoundException('Estrutura da importação não encontrada.');
    return {
      ...estrutura,
      secoes: this.parseJson(estrutura.secoesJson),
      anexos: this.parseJson(estrutura.anexosJson),
      tabelas: this.parseJson(estrutura.tabelasJson),
      assinaturas: this.parseJson(estrutura.assinaturasJson),
      arquivoFonte: estrutura.importLog.arquivoCaminho,
      arquivoNome: estrutura.importLog.arquivoNome,
    };
  }

  async atualizarCampos(importacaoId: string, campos: Array<{ id?: string; chave: string; valor?: string; statusRevisao?: string }>) {
    await this.obter(importacaoId);
    const estrutura = await this.prisma.importacaoEstrutura.findUnique({ where: { importLogId: importacaoId } });
    if (!estrutura) throw new NotFoundException('Estrutura da importação ainda não foi gerada.');
    for (const campo of campos) {
      const where = campo.id ? { id: campo.id } : undefined;
      const alvo = where
        ? await this.prisma.importacaoCampo.findFirst({ where: { id: campo.id, estruturaId: estrutura.id } })
        : await this.prisma.importacaoCampo.findFirst({ where: { estruturaId: estrutura.id, chave: campo.chave } });
      if (!alvo) continue;
      await this.prisma.importacaoCampo.update({
        where: { id: alvo.id },
        data: {
          valor: campo.valor ?? null,
          statusRevisao: campo.statusRevisao || STATUS_REVISAO.CONFIRMADO,
          origem: 'manual',
        },
      });
    }
    return this.obter(importacaoId);
  }

  async aplicar(importacaoId: string, modo: 'ATUALIZAR' | 'CRIAR_NOVO', usuarioId: string, editalDestinoId?: string) {
    const estrutura = await this.obter(importacaoId);
    if (modo === 'ATUALIZAR') {
      const editalId = editalDestinoId || estrutura.editalId || estrutura.importLog.editalId;
      if (!editalId) throw new BadRequestException('A importação ainda não possui edital para atualizar.');
      return this.aplicarNoEdital(editalId, estrutura, usuarioId, false);
    }
    return this.criarNovo(estrutura, usuarioId);
  }

  private async aplicarNoEdital(editalId: string, estrutura: any, usuarioId: string, novo: boolean) {
    const edital = await this.composicao.obter(editalId);
    this.composicao.assertEditavel(edital.documento?.statusComposicao);
    const confirmados = new Map(estrutura.campos.filter((campo: any) => campo.statusRevisao === STATUS_REVISAO.CONFIRMADO && campo.valor).map((campo: any) => [campo.chave, campo.valor]));
    const documento = edital.documento
      ? await this.prisma.editalDocumento.update({
        where: { id: edital.documento.id },
        data: {
          origem: 'IMPORTACAO',
          arquivoFonte: estrutura.arquivoFonte,
          importacaoId: estrutura.importLogId,
          conteudoManual: novo ? estrutura.parametrizado : edital.documento.conteudoManual,
          statusComposicao: 'EM_CONFERENCIA',
          processoAdministrativo: novo ? null : (confirmados.get('edital.processoAdministrativo') || edital.documento.processoAdministrativo),
          legislacaoAplicavel: confirmados.get('edital.legislacaoAplicavel') || (novo ? null : edital.documento.legislacaoAplicavel),
          localRecebimento: confirmados.get('edital.localSessao') || (novo ? null : edital.documento.localRecebimento),
          comissao: confirmados.get('edital.comissao') || (novo ? null : edital.documento.comissao),
          foro: confirmados.get('edital.foro') || (novo ? null : edital.documento.foro),
          updatedBy: usuarioId,
        },
      })
      : await this.prisma.editalDocumento.create({
        data: {
          editalId,
          origem: 'IMPORTACAO',
          arquivoFonte: estrutura.arquivoFonte,
          importacaoId: estrutura.importLogId,
          conteudoManual: estrutura.parametrizado,
          statusComposicao: 'EM_CONFERENCIA',
          createdBy: usuarioId,
          updatedBy: usuarioId,
        },
      });

    if (!edital.documento) {
      await this.templates.garantirPadroes(usuarioId);
      const templates = await this.prisma.templateDocumento.findMany({
        where: { deletedAt: null, ativo: true },
        include: { versoes: { orderBy: { numero: 'desc' }, take: 1 } },
      });
      const detectados = new Set((estrutura.anexos || []).map((anexo: any) => anexo.tipo));
      detectados.add('EDITAL_PRINCIPAL');
      for (const template of templates) {
        if (!detectados.has(template.tipo) && template.tipo !== 'EDITAL_PRINCIPAL') continue;
        await this.prisma.editalAnexo.create({
          data: {
            documentoId: documento.id,
            templateId: template.id,
            templateVersaoId: template.versoes[0]?.id,
            tipo: template.tipo,
            ordem: template.ordem,
            titulo: (estrutura.anexos || []).find((anexo: any) => anexo.tipo === template.tipo)?.titulo || template.titulo,
            incluido: template.tipo === 'EDITAL_PRINCIPAL' || detectados.has(template.tipo),
          },
        });
      }
    }

    for (const campo of estrutura.campos) {
      await this.prisma.editalVariavel.upsert({
        where: { documentoId_chave_escopo: { documentoId: documento.id, chave: campo.chave, escopo: '' } },
        update: {
          valor: campo.statusRevisao === STATUS_REVISAO.CONFIRMADO ? campo.valor : null,
          valorExtraido: campo.valorExtraido,
          origem: campo.origem,
          confianca: campo.confianca,
          paginaOrigem: campo.paginaOrigem,
          sensivel: campo.sensivel,
          statusRevisao: campo.statusRevisao,
        },
        create: {
          documentoId: documento.id,
          chave: campo.chave,
          valor: campo.statusRevisao === STATUS_REVISAO.CONFIRMADO ? campo.valor : null,
          valorExtraido: campo.valorExtraido,
          origem: campo.origem,
          confianca: campo.confianca,
          paginaOrigem: campo.paginaOrigem,
          sensivel: campo.sensivel,
          statusRevisao: campo.statusRevisao,
        },
      });
    }
    return this.composicao.obter(editalId);
  }

  private async criarNovo(estrutura: any, usuarioId: string) {
    const confirmado = (chave: string) => estrutura.campos.find((campo: any) => campo.chave === chave && campo.statusRevisao === STATUS_REVISAO.CONFIRMADO)?.valor;
    const criado = await this.composicao.criar({
      numero: confirmado('edital.numero') || 'A-DEFINIR',
      ano: Number(confirmado('edital.ano')) || new Date().getFullYear(),
      titulo: confirmado('edital.titulo') || estrutura.arquivoNome || 'Edital a partir de importação',
      objeto: confirmado('edital.objeto') || undefined,
    }, usuarioId);
    await this.prisma.editalDocumento.update({
      where: { editalId: criado.id },
      data: {
        origem: 'IMPORTACAO',
        arquivoFonte: estrutura.arquivoFonte,
        importacaoId: estrutura.importLogId,
        conteudoManual: estrutura.parametrizado,
        statusComposicao: 'EM_CONFERENCIA',
      },
    });
    const documento = await this.prisma.editalDocumento.findUnique({ where: { editalId: criado.id } });
    if (documento) {
      for (const campo of estrutura.campos) {
        const usar = campo.statusRevisao === STATUS_REVISAO.CONFIRMADO && !campo.sensivel;
        await this.prisma.editalVariavel.upsert({
          where: { documentoId_chave_escopo: { documentoId: documento.id, chave: campo.chave, escopo: '' } },
          update: {
            valor: usar ? campo.valor : null,
            valorExtraido: campo.valorExtraido,
            sensivel: campo.sensivel,
            statusRevisao: campo.sensivel ? STATUS_REVISAO.PENDENTE : campo.statusRevisao,
            paginaOrigem: campo.paginaOrigem,
            confianca: campo.confianca,
            origem: 'extraido_automaticamente',
          },
          create: {
            documentoId: documento.id,
            chave: campo.chave,
            valor: usar ? campo.valor : null,
            valorExtraido: campo.valorExtraido,
            sensivel: campo.sensivel,
            statusRevisao: campo.sensivel ? STATUS_REVISAO.PENDENTE : campo.statusRevisao,
            paginaOrigem: campo.paginaOrigem,
            confianca: campo.confianca,
            origem: 'extraido_automaticamente',
          },
        });
      }
    }
    return this.composicao.obter(criado.id);
  }

  private async lerPdf(buffer: Buffer): Promise<{ texto: string; paginas: PaginaTexto[] }> {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const paginas = (result.pages || []).map((pagina: { text?: string }, index: number) => ({
        numero: index + 1,
        texto: pagina.text || '',
      }));
      return { texto: result.text || paginas.map((pagina) => pagina.texto).join('\n'), paginas };
    } finally {
      await parser.destroy();
    }
  }

  private parseJson(valor?: string | null) {
    if (!valor) return [];
    try {
      return JSON.parse(valor);
    } catch {
      return [];
    }
  }
}
