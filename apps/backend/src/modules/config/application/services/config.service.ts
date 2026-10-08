import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.systemConfig.findMany({ orderBy: { chave: 'asc' } });
  }

  async get(chave: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { chave } });
    return config?.valor || null;
  }

  async getMany(chaves: string[]) {
    const configs = await this.prisma.systemConfig.findMany({
      where: { chave: { in: chaves } },
    });
    const map: Record<string, string> = {};
    for (const c of configs) map[c.chave] = c.valor;
    return map;
  }

  async set(chave: string, valor: string, descricao?: string, tipo?: string) {
    return this.prisma.systemConfig.upsert({
      where: { chave },
      create: { chave, valor, descricao, tipo: tipo || 'texto' },
      update: { valor, descricao, tipo },
    });
  }

  async setMany(configs: Array<{ chave: string; valor: string; descricao?: string; tipo?: string }>) {
    const results = [];
    for (const c of configs) {
      results.push(await this.set(c.chave, c.valor, c.descricao, c.tipo));
    }
    return results;
  }

  async remove(chave: string) {
    return this.prisma.systemConfig.delete({ where: { chave } });
  }

  async initDefaults() {
    const defaults = [
      { chave: 'sistema.nome', valor: 'SEAF PNAE', descricao: 'Nome do sistema', tipo: 'texto' },
      { chave: 'sistema.versao', valor: '1.0.0', descricao: 'Versão do sistema', tipo: 'texto' },
      { chave: 'orgao.nome', valor: 'Governo do Estado de Mato Grosso', descricao: 'Nome do órgão', tipo: 'texto' },
      { chave: 'orgao.secretaria', valor: 'Secretaria de Estado de Educação', descricao: 'Secretaria responsável', tipo: 'texto' },
      { chave: 'orgao.programa', valor: 'Programa Nacional de Alimentação Escolar — PNAE', descricao: 'Programa', tipo: 'texto' },
      { chave: 'documento.validade_padrao', valor: '30', descricao: 'Validade padrão das propostas (dias)', tipo: 'numero' },
      { chave: 'documento.prazo_entrega_padrao', valor: '15', descricao: 'Prazo padrão de entrega (dias)', tipo: 'numero' },
      { chave: 'upload.tamanho_maximo_mb', valor: '50', descricao: 'Tamanho máximo de upload (MB)', tipo: 'numero' },
      { chave: 'upload.tipos_permitidos', valor: '.pdf', descricao: 'Tipos de arquivo permitidos', tipo: 'texto' },
    ];
    return this.setMany(defaults);
  }
}
