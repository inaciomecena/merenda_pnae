import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, StatusProposta, TipoProposta } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreatePropostaDto, UpdatePropostaDto, PreviewPropostaDto, TipoPropostaDto } from '../../presentation/dto/proposta.dto';
import { DocumentGeneratorService } from './document-generator.service';
import { PropostaPdfData } from './pdf-generator.service';
import * as fs from 'fs';

@Injectable()
export class PropostasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docGenerator: DocumentGeneratorService,
  ) {}

  async findAll(query: { page?: number; limit?: number; status?: string; editalId?: string; produtorId?: string }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const where: any = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.editalId) where.editalId = query.editalId;
    if (query.produtorId) where.produtorId = query.produtorId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.proposta.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { edital: true, produtor: { include: { municipio: true } }, itens: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.proposta.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.prisma.proposta.findFirst({
      where: { id, deletedAt: null },
      include: {
        edital: { include: { municipio: true } },
        produtor: { include: { municipio: true } },
        itens: true,
      },
    });
    if (!item) throw new NotFoundException('Proposta não encontrada');
    return item;
  }

  async preview(dto: PreviewPropostaDto): Promise<PropostaPdfData> {
    return this.docGenerator.preview(dto.editalId, dto.produtorId, dto.tipoDocumento);
  }

  async create(dto: CreatePropostaDto) {
    const edital = await this.prisma.edital.findUnique({ where: { id: dto.editalId } });
    if (!edital) throw new NotFoundException('Edital não encontrado');

    if (dto.produtorId) {
      const produtor = await this.prisma.produtor.findUnique({ where: { id: dto.produtorId } });
      if (!produtor) throw new NotFoundException('Produtor não encontrado');
    }

    const tipo = (dto.tipoDocumento || TipoPropostaDto.ANEXO_III) as TipoProposta;

    const existing = await this.prisma.proposta.findFirst({
      where: {
        editalId: dto.editalId,
        produtorId: dto.produtorId || undefined,
        tipoDocumento: tipo,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Já existe uma proposta para este edital/produtor/tipo. Crie uma nova versão.');
    }

    const numero = `PNAE-${edital.numero}/${edital.ano}-${tipo === TipoProposta.ANEXO_III ? 'A3' : 'PV'}`;

    const createData: any = {
      edital: { connect: { id: dto.editalId } },
      numero,
      tipoDocumento: tipo,
      status: StatusProposta.RASCUNHO,
      validadeDias: dto.validadeDias || 30,
      prazoEntrega: dto.prazoEntrega || 15,
      createdBy: 'system',
    };
    if (dto.produtorId) createData.produtorId = dto.produtorId;
    if (dto.observacao) createData.observacao = dto.observacao;

    const proposta = await this.prisma.proposta.create({ data: createData });

    if (dto.itens && dto.itens.length > 0) {
      await this.addItens(proposta.id, dto.itens);
    }

    return this.findOne(proposta.id);
  }

  async addItens(propostaId: string, itens: CreatePropostaDto['itens']) {
    const proposta = await this.findOne(propostaId);
    if (proposta.status === StatusProposta.FINALIZADA) {
      throw new BadRequestException('Não é possível adicionar itens a proposta finalizada');
    }

    for (const item of itens || []) {
      const valorTotal = item.quantidade && item.precoUnitario ? item.quantidade * item.precoUnitario : null;
      const itemData: any = {
        proposta: { connect: { id: propostaId } },
        produto: item.produto,
        createdBy: 'system',
      };
      if (item.matchId) itemData.matchId = item.matchId;
      if (item.especificacao) itemData.especificacao = item.especificacao;
      if (item.marca) itemData.marca = item.marca;
      if (item.quantidade) itemData.quantidade = item.quantidade;
      if (item.unidade) itemData.unidade = item.unidade;
      if (item.precoUnitario) itemData.precoUnitario = item.precoUnitario;
      if (valorTotal) itemData.valorTotal = valorTotal;

      await this.prisma.propostaItem.create({ data: itemData });
    }

    await this.recalculateTotal(propostaId);
    return this.findOne(propostaId);
  }

  async update(id: string, dto: UpdatePropostaDto) {
    const proposta = await this.findOne(id);
    if (proposta.status === StatusProposta.FINALIZADA) {
      throw new BadRequestException('Não é possível alterar proposta finalizada');
    }

    const data: Prisma.PropostaUpdateInput = {
      ...(dto.produtorId !== undefined ? { produtor: dto.produtorId ? { connect: { id: dto.produtorId } } : { disconnect: true } } : {}),
      ...(dto.tipoDocumento !== undefined ? { tipoDocumento: dto.tipoDocumento as TipoProposta } : {}),
      ...(dto.validadeDias !== undefined ? { validadeDias: dto.validadeDias } : {}),
      ...(dto.prazoEntrega !== undefined ? { prazoEntrega: dto.prazoEntrega } : {}),
      ...(dto.observacao !== undefined ? { observacao: dto.observacao } : {}),
      updatedBy: 'system',
    };

    await this.prisma.proposta.update({ where: { id }, data });

    if (dto.itens) {
      await this.prisma.propostaItem.deleteMany({ where: { propostaId: id } });
      await this.addItens(id, dto.itens);
    }

    return this.findOne(id);
  }

  async generate(propostaId: string) {
    const proposta = await this.findOne(propostaId);
    if (proposta.itens.length === 0) {
      throw new BadRequestException('Proposta não possui itens para gerar documentos');
    }
    return this.docGenerator.generate(propostaId);
  }

  async download(propostaId: string, tipo: 'pdf' | 'docx') {
    const filePath = await this.docGenerator.getFilePath(propostaId, tipo);
    return { filePath, filename: path.basename(filePath) };
  }

  async finalizar(propostaId: string) {
    const proposta = await this.findOne(propostaId);
    if (proposta.status === StatusProposta.FINALIZADA) {
      throw new BadRequestException('Proposta já está finalizada');
    }
    if (proposta.itens.length === 0) {
      throw new BadRequestException('Não é possível finalizar proposta sem itens');
    }

    return this.prisma.proposta.update({
      where: { id: propostaId },
      data: { status: StatusProposta.FINALIZADA, updatedBy: 'system' },
      include: { edital: true, produtor: { include: { municipio: true } }, itens: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.proposta.update({
      where: { id },
      data: { deletedAt: new Date(), status: StatusProposta.CANCELADA, updatedBy: 'system' },
    });
  }

  async getProducersWithApprovedMatches(editalId: string) {
    const matches = await this.prisma.match.findMany({
      where: { editalId, status: 'APROVADO', deletedAt: null },
      include: { produtor: { include: { municipio: true } } },
      distinct: ['produtorId'],
    });

    return matches
      .filter(m => m.produtor)
      .map(m => m.produtor);
  }

  private async recalculateTotal(propostaId: string) {
    const items = await this.prisma.propostaItem.findMany({
      where: { propostaId, deletedAt: null },
    });
    const total = items.reduce((sum, i) => sum + (i.valorTotal ? Number(i.valorTotal) : 0), 0);
    await this.prisma.proposta.update({
      where: { id: propostaId },
      data: { valorTotal: total, updatedBy: 'system' },
    });
  }
}

import * as path from 'path';
