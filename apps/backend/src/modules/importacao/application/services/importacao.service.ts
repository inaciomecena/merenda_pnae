import { Injectable } from '@nestjs/common';
import { Prisma, StatusImportacao } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ImportacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async listarArquivosPdf() {
    const dir = path.resolve(process.cwd(), '..', '..', 'docs');
    const files = fs.existsSync(dir) ? fs.readdirSync(dir, { encoding: 'utf8' }).filter((file) => file.endsWith('.pdf')) : [];
    return files.map((file) => ({ nome: file, caminho: path.join(dir, file) }));
  }

  async findAll(query: { page?: number; limit?: number; status?: string }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const where: Prisma.ImportLogWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status as StatusImportacao } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.importLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.importLog.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: { editalId?: string; arquivoNome: string; status: string; resumo?: string; createdBy?: string }) {
    return this.prisma.importLog.create({
      data: {
        arquivoNome: dto.arquivoNome,
        arquivoCaminho: path.resolve(process.cwd(), '..', '..', 'docs', dto.arquivoNome),
        origem: 'LEGACY',
        status: dto.status as StatusImportacao,
        resumo: dto.resumo,
        createdBy: dto.createdBy,
        ...(dto.editalId ? { edital: { connect: { id: dto.editalId } } } : {}),
      },
    });
  }
}
