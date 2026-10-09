import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { renderDocx } from '../domain/documento-renderer';
import { renderPdfEdital } from '../domain/edital-pdf-layout';
import { CHAVES_ESPECIAIS, extrairPlaceholders, STATUS_REVISAO } from '../domain/placeholders';
import { campoDoProjeto } from '../domain/campos-produtor';
import { validarGeracao } from '../domain/validacao-geracao';
import { ComposicaoEditalService } from './composicao-edital.service';

@Injectable()
export class GeracaoEditalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly composicao: ComposicaoEditalService,
  ) {}

  async previa(editalId: string) {
    const pacote = await this.montar(editalId);
    return {
      validacao: pacote.validacao,
      secoes: pacote.input.secoes.map((secao) => ({ titulo: secao.titulo, tipo: secao.tipo, ordem: secao.ordem, conteudo: secao.conteudo })),
      versao: pacote.input.versao,
      origem: pacote.edital.documento?.origem,
      arquivoFonte: pacote.edital.documento?.arquivoFonte || pacote.edital.arquivoFonte,
      status: pacote.edital.documento?.statusComposicao,
    };
  }

  async gerar(editalId: string, usuario: { id?: string; nome?: string; ip?: string }) {
    const pacote = await this.montar(editalId);
    if (!pacote.validacao.ok) {
      await this.registrar(pacote, usuario, 'VALIDACAO', null, pacote.validacao.erros.join(' '));
      throw new BadRequestException({ message: 'Revise as pendências abaixo para gerar o edital.', erros: pacote.validacao.erros });
    }

    const selo = Date.now();
    const pasta = path.resolve(process.cwd(), 'storage', 'editais-gerados', editalId);
    const base = path.join(pasta, `v${pacote.input.versao}-${selo}`);
    const pdfPath = await this.renderPacotePdf(pacote.input, `${base}.pdf`);
    const docxPath = await renderDocx(pacote.input, `${base}.docx`);
    const versao = await this.prisma.editalVersao.upsert({
      where: { documentoId_numero: { documentoId: pacote.edital.documento!.id, numero: pacote.input.versao } },
      update: { statusComposicao: 'GERADO', snapshot: JSON.stringify({ geradoEm: pacote.input.geradoEm, usuario: pacote.input.usuario }), motivo: 'Geração de documentos' },
      create: {
        documentoId: pacote.edital.documento!.id,
        numero: pacote.input.versao,
        statusComposicao: 'GERADO',
        snapshot: JSON.stringify({ geradoEm: pacote.input.geradoEm, usuario: pacote.input.usuario }),
        motivo: 'Geração de documentos',
        createdBy: usuario.id,
      },
    });
    await this.registrar(pacote, usuario, 'SUCESSO', path.relative(process.cwd(), pdfPath), null, versao.id, 'PDF');
    await this.registrar(pacote, usuario, 'SUCESSO', path.relative(process.cwd(), docxPath), null, versao.id, 'DOCX');
    await this.prisma.editalDocumento.update({
      where: { id: pacote.edital.documento!.id },
      data: { statusComposicao: 'GERADO', updatedBy: usuario.id },
    });
    return this.composicao.obter(editalId);
  }

  private async renderPacotePdf(input: any, outputPath: string) {
    const fontes = (input.secoes || []).filter((secao: any) => secao.formato === 'PDF' && secao.arquivoBase);
    if (!fontes.length || fontes.length !== input.secoes.length) return renderPdfEdital(input, outputPath);
    const destino = await PDFDocument.create();
    for (const secao of fontes.sort((a: any, b: any) => a.ordem - b.ordem)) {
      const caminho = path.isAbsolute(secao.arquivoBase) ? secao.arquivoBase : path.resolve(process.cwd(), secao.arquivoBase);
      if (!fs.existsSync(caminho)) throw new BadRequestException(`Arquivo do template não encontrado: ${secao.titulo}.`);
      const origem = await PDFDocument.load(await fs.promises.readFile(caminho));
      const paginas = await destino.copyPages(origem, origem.getPageIndices());
      paginas.forEach((pagina) => destino.addPage(pagina));
    }
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, await destino.save());
    return outputPath;
  }

  async arquivo(editalId: string, formato: string) {
    const alvo = formato.toUpperCase() === 'DOCX' ? 'DOCX' : 'PDF';
    const geracao = await this.prisma.historicoGeracaoDocumento.findFirst({
      where: { editalId, formato: alvo, status: 'SUCESSO', arquivoPath: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (!geracao?.arquivoPath) throw new NotFoundException(`Nenhum ${alvo} gerado para este edital.`);
    const absoluto = path.isAbsolute(geracao.arquivoPath) ? geracao.arquivoPath : path.resolve(process.cwd(), geracao.arquivoPath);
    if (!fs.existsSync(absoluto)) throw new NotFoundException('Arquivo gerado não encontrado no disco.');
    return { caminho: absoluto, nome: path.basename(absoluto), formato: alvo };
  }

  private async montar(editalId: string) {
    const edital = await this.composicao.obter(editalId);
    if (!edital.documento) throw new BadRequestException('Edital sem composição documental. Salve a estrutura antes de gerar.');
    const valores: Record<string, string> = {};
    for (const variavel of edital.documento.variaveis) {
      if (variavel.escopo) continue;
      if (variavel.valor) valores[variavel.chave] = variavel.valor;
    }

    const secoes = edital.documento.anexos.filter((anexo) => anexo.incluido).map((anexo) => ({
      titulo: anexo.titulo,
      tipo: anexo.tipo,
      ordem: anexo.ordem,
      conteudo: anexo.conteudoManual || anexo.templateVersao?.conteudo || anexo.template?.conteudo || '',
      formato: anexo.templateVersao?.formato || anexo.template?.formato,
      arquivoBase: anexo.templateVersao?.arquivoBase || anexo.template?.arquivoBase,
      templateId: anexo.templateId,
      codigoModelo: anexo.template?.codigoModelo,
      finalidade: anexo.template?.finalidade,
      perfilFornecedor: anexo.template?.perfilFornecedor,
      vigenciaFim: anexo.templateVersao?.vigenciaFim || anexo.template?.vigenciaFim,
    }));
    if (edital.documento.conteudoManual) {
      const principal = secoes.find((secao) => secao.tipo === 'EDITAL_PRINCIPAL');
      if (principal) principal.conteudo = edital.documento.conteudoManual;
    }

    const usadas = new Set(secoes.flatMap((secao) => extrairPlaceholders(secao.conteudo)));
    const pendentes = edital.documento.variaveis
      .filter((variavel) => !variavel.escopo && usadas.has(variavel.chave)
        && !CHAVES_ESPECIAIS.has(variavel.chave) && !campoDoProjeto(variavel.chave)
        && variavel.statusRevisao === STATUS_REVISAO.PENDENTE
        && Boolean(variavel.valor?.trim() || variavel.valorExtraido?.trim()))
      .map((variavel) => variavel.chave);

    const validacao = validarGeracao({
      statusComposicao: edital.documento.statusComposicao,
      numero: edital.numero,
      ano: edital.ano,
      titulo: edital.titulo,
      objeto: edital.objeto,
      municipioNome: edital.municipio?.nome,
      dataPublicacao: edital.dataPublicacao,
      dataSessao: edital.documento.dataRecebimento,
      valores,
      variaveisPendentes: pendentes,
      anexos: secoes.map((secao) => ({
        tipo: secao.tipo,
        titulo: secao.titulo,
        incluido: true,
        templateId: secao.templateId,
        conteudo: secao.conteudo,
        vigenciaFim: secao.vigenciaFim,
      })),
      itens: edital.itens.map((item) => ({ produto: item.produtoOriginal, quantidade: item.quantidade?.toString(), unidade: item.unidade })),
      conteudos: secoes.map((secao) => secao.conteudo),
    });

    // Os dados do produtor serão preenchidos no projeto; o edital publica formulários em branco.
    const valoresRenderizacao = { ...valores };
    for (const chave of usadas) {
      if (!CHAVES_ESPECIAIS.has(chave) && !valoresRenderizacao[chave]?.trim()) valoresRenderizacao[chave] = '________________';
    }
    const input = {
      numero: edital.numero,
      ano: edital.ano,
      titulo: edital.titulo,
      versao: edital.documento.versaoAtual,
      usuario: edital.documento.updatedBy || edital.documento.createdBy || 'sistema',
      geradoEm: new Date().toLocaleString('pt-BR'),
      valores: valoresRenderizacao,
      secoes,
      produtos: edital.itens.map((item, index) => ({
        numero: item.numeroItem ?? index + 1, produto: item.produtoOriginal, especificacao: item.especificacao || '',
        quantidade: item.quantidade?.toString() || '', unidade: item.unidade || '',
        precoUnitario: item.precoUnitario?.toString() || '',
        total: item.quantidade != null && item.precoUnitario != null ? String(Number(item.quantidade) * Number(item.precoUnitario)) : '',
      })),
      escolasDetalhes: edital.escolasVinculadas.map(({ escola }) => ({ nome: escola.nome, endereco: escola.endereco, telefone: escola.telefone })),
      itens: [
        { colunas: ['Item', 'Produto', 'Especificação', 'Quantidade', 'Unidade'] },
        ...edital.itens.map((item) => ({
          colunas: [
            String(item.numeroItem ?? ''),
            item.produtoOriginal,
            item.especificacao || '',
            item.quantidade?.toString() || '',
            item.unidade || '',
          ],
        })),
      ],
      escolas: edital.escolasVinculadas.map((item) => item.escola.nome),
      fornecedores: (valores.fornecedores || '').split('\n').map((item) => item.trim()).filter(Boolean),
    };
    return { edital, validacao, input };
  }

  private registrar(
    pacote: Awaited<ReturnType<GeracaoEditalService['montar']>>,
    usuario: { id?: string; nome?: string; ip?: string },
    status: 'SUCESSO' | 'ERRO' | 'VALIDACAO',
    arquivoPath: string | null,
    mensagem: string | null,
    versaoId?: string,
    formato = 'PDF',
  ) {
    return this.prisma.historicoGeracaoDocumento.create({
      data: {
        documentoId: pacote.edital.documento!.id,
        editalId: pacote.edital.id,
        versaoId: versaoId || null,
        versaoNumero: pacote.input.versao,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        formato,
        arquivoPath,
        status,
        mensagem,
        ipAddress: usuario.ip,
      },
    });
  }
}
