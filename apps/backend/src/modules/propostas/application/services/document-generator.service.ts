import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type { PropostaPdfData } from './pdf-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { DocxGeneratorService } from './docx-generator.service';
import { TipoPropostaDto } from '../../presentation/dto/proposta.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentGeneratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly docxGenerator: DocxGeneratorService,
  ) {}

  async preview(editalId: string, produtorId: string, tipoDocumento: TipoPropostaDto): Promise<PropostaPdfData> {
    const edital = await this.prisma.edital.findUnique({ where: { id: editalId }, include: { municipio: true } });
    if (!edital) throw new NotFoundException('Edital nao encontrado. Verifique se o edital foi importado e confirmado.');

    const produtor = await this.prisma.produtor.findUnique({ where: { id: produtorId }, include: { municipio: true, produtos: true } });
    if (!produtor) throw new NotFoundException('Produtor nao encontrado. Verifique se o produtor foi cadastrado com endereco e municipio.');

    const matches = await this.prisma.match.findMany({
      where: {
        editalId,
        produtorId,
        status: 'APROVADO',
        deletedAt: null,
      },
      include: { editalItem: true, produtorProduto: true },
    });

    if (!matches.length) {
      throw new BadRequestException(
        `Nenhum match aprovado encontrado para o edital "${edital.numero}/${edital.ano}" e o produtor "${produtor.nome}". Acesse o modulo de Balizamento para aprovar matches antes de gerar propostas.`,
      );
    }

    const itens = matches.map(m => {
      const item = m.editalItem;
      const prodProduto = m.produtorProduto;
      const qtd = Number(item.quantidade || 0);
      const preco = Number(prodProduto?.precoSugerido || item.precoUnitario || 0);
      return {
        produto: prodProduto?.produto || item.produtoOriginal,
        especificacao: item.especificacao || undefined,
        marca: prodProduto?.capacidade || undefined,
        quantidade: qtd || undefined,
        unidade: item.unidade || prodProduto?.unidade || undefined,
        precoUnitario: preco || undefined,
        valorTotal: qtd && preco ? qtd * preco : undefined,
        matchId: m.id,
      };
    });

    const valorTotal = itens.reduce((sum, i) => sum + (i.valorTotal || 0), 0);
    const now = new Date();

    return {
      numeroProposta: `PNAE-${edital.numero}/${edital.ano}-${tipoDocumento === 'ANEXO_III' ? 'A3' : 'PV'}`,
      tipoDocumento,
      edital: {
        numero: edital.numero,
        ano: edital.ano,
        titulo: edital.titulo,
        objeto: edital.objeto || undefined,
        municipio: edital.municipio ? { nome: edital.municipio.nome, uf: edital.municipio.uf } : undefined,
      },
      produtor: {
        nome: produtor.nome,
        cpfCnpj: produtor.cpfCnpj || undefined,
        telefone: produtor.telefone || undefined,
        endereco: produtor.endereco || undefined,
        municipio: { nome: produtor.municipio.nome, uf: produtor.municipio.uf },
      },
      itens,
      valorTotal,
      validadeDias: 30,
      prazoEntrega: 15,
      dataGeracao: now.toLocaleDateString('pt-BR'),
    };
  }

  async generate(propostaId: string): Promise<{ pdfPath: string; docxPath: string }> {
    const proposta = await this.prisma.proposta.findUnique({
      where: { id: propostaId },
      include: { edital: { include: { municipio: true } }, itens: true },
    });
    if (!proposta) throw new NotFoundException('Proposta nao encontrada.');

    if (proposta.itens.length === 0) {
      throw new BadRequestException(
        'Esta proposta nao possui itens. Adicione itens antes de gerar os documentos. Os itens sao vinculados automaticamente dos matches aprovados no Balizamento.',
      );
    }

    const produtor = proposta.produtorId
      ? await this.prisma.produtor.findUnique({ where: { id: proposta.produtorId }, include: { municipio: true } })
      : null;

    const edital = proposta.edital;
    const data: PropostaPdfData = {
      numeroProposta: proposta.numero || `PNAE-${edital.numero}/${edital.ano}`,
      tipoDocumento: proposta.tipoDocumento,
      edital: {
        numero: edital.numero,
        ano: edital.ano,
        titulo: edital.titulo,
        objeto: edital.objeto || undefined,
        municipio: edital.municipio ? { nome: edital.municipio.nome, uf: edital.municipio.uf } : undefined,
      },
      produtor: {
        nome: produtor?.nome || '—',
        cpfCnpj: produtor?.cpfCnpj || undefined,
        telefone: produtor?.telefone || undefined,
        endereco: produtor?.endereco || undefined,
        municipio: produtor?.municipio ? { nome: produtor.municipio.nome, uf: produtor.municipio.uf } : { nome: '—', uf: 'MT' },
      },
      itens: proposta.itens.map(i => ({
        produto: i.produto,
        especificacao: i.especificacao || undefined,
        marca: i.marca || undefined,
        quantidade: i.quantidade ? Number(i.quantidade) : undefined,
        unidade: i.unidade || undefined,
        precoUnitario: i.precoUnitario ? Number(i.precoUnitario) : undefined,
        valorTotal: i.valorTotal ? Number(i.valorTotal) : undefined,
      })),
      valorTotal: proposta.valorTotal ? Number(proposta.valorTotal) : 0,
      validadeDias: proposta.validadeDias,
      prazoEntrega: proposta.prazoEntrega,
      observacao: proposta.observacao || undefined,
      dataGeracao: new Date().toLocaleDateString('pt-BR'),
    };

    const ano = edital.ano;
    const editalNum = edital.numero.replace(/[^a-zA-Z0-9]/g, '_');
    const produtorSlug = (produtor?.nome || 'sem_produtor').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const baseDir = path.join(process.cwd(), '..', '..', 'storage', 'propostas', String(ano), editalNum, produtorSlug);
    fs.mkdirSync(baseDir, { recursive: true });

    const tipoSlug = proposta.tipoDocumento === 'ANEXO_III' ? 'anexo_iii' : 'projeto_venda';
    const pdfPath = path.join(baseDir, `${tipoSlug}.pdf`);
    const docxPath = path.join(baseDir, `${tipoSlug}.docx`);

    await this.pdfGenerator.generate(data, pdfPath);
    await this.docxGenerator.generate(data, docxPath);

    await this.prisma.proposta.update({
      where: { id: propostaId },
      data: {
        status: 'GERADA',
        arquivoPdfPath: pdfPath,
        arquivoDocxPath: docxPath,
        updatedBy: 'system',
      },
    });

    return { pdfPath, docxPath };
  }

  async getFilePath(propostaId: string, tipo: 'pdf' | 'docx'): Promise<string> {
    const proposta = await this.prisma.proposta.findUnique({ where: { id: propostaId } });
    if (!proposta) throw new NotFoundException('Proposta não encontrada');

    const filePath = tipo === 'pdf' ? proposta.arquivoPdfPath : proposta.arquivoDocxPath;
    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException(`Arquivo ${tipo.toUpperCase()} não encontrado. Gere a proposta primeiro.`);
    }
    return filePath;
  }
}
