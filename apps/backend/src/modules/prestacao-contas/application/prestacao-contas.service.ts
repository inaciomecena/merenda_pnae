import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusPrestacaoContas } from '@prisma/client';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../../../common/auth/user-scope';
import { PolicyService } from '../../../common/auth/policy.service';
import { AuditService } from '../../audit/application/services/audit.service';

export interface PrestacaoFiltros {
  exercicio?: number;
  periodoInicio?: string;
  periodoFim?: string;
  municipioId?: string;
  dreId?: string;
  escolaId?: string;
  editalId?: string;
  contratoId?: string;
  fornecedorId?: string;
  statusDocumental?: 'PENDENTE' | 'REGULAR';
  statusFinanceiro?: 'PENDENTE' | 'PAGO' | 'PARCIAL';
}

type LinhaDemonstrativo = {
  contratoId: string; numero: string; exercicio: number; municipio: string | null; dre: string | null;
  escola: string | null; edital: string | null; fornecedor: string; contratado: string; recebido: string;
  faturado: string; atestado: string; liquidado: string; pago: string; saldoContratual: string;
  pendenciasDocumentais: number; divergencias: number; statusDocumental: string; statusFinanceiro: string;
};

const dinheiro = (value: Prisma.Decimal | number | null | undefined) => new Prisma.Decimal(value ?? 0).toFixed(2);
const data = (value?: string, campo = 'data') => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new BadRequestException(`${campo} invalida.`);
  return parsed;
};

@Injectable()
export class PrestacaoContasService {
  constructor(private readonly prisma: PrismaService, private readonly policy: PolicyService, private readonly audit: AuditService) {}

  private async contratosWhere(filters: PrestacaoFiltros, user?: AuthenticatedUser): Promise<Prisma.ContratoWhereInput> {
    const where: Prisma.ContratoWhereInput = {
      deletedAt: null,
      ...(user ? {} : { status: { in: ['VIGENTE', 'SUSPENSO', 'ENCERRADO'] }, edital: { status: 'ATIVO' } }),
      ...(filters.exercicio ? { exercicio: filters.exercicio } : {}),
      ...(filters.municipioId ? { municipioId: filters.municipioId } : {}),
      ...(filters.dreId ? { dreId: filters.dreId } : {}),
      ...(filters.escolaId ? { escolaId: filters.escolaId } : {}),
      ...(filters.editalId ? { editalId: filters.editalId } : {}),
      ...(filters.contratoId ? { id: filters.contratoId } : {}),
      ...(filters.fornecedorId ? { produtorId: filters.fornecedorId } : {}),
    };
    if (!user || user.role === 'ADMIN') return where;
    if (user.role === 'DRE') where.dreId = { in: await this.policy.getAuthorizedDREIds(user) };
    else if (user.role === 'ESCOLA') where.escolaId = { in: await this.policy.getAuthorizedEscolaIds(user) };
    else where.produtorId = { in: await this.policy.getAuthorizedProdutorIds(user) };
    return where;
  }

  private async linhas(filters: PrestacaoFiltros, user?: AuthenticatedUser): Promise<LinhaDemonstrativo[]> {
    const periodoInicio = data(filters.periodoInicio, 'periodoInicio');
    const periodoFim = data(filters.periodoFim, 'periodoFim');
    if (periodoInicio && periodoFim && periodoFim < periodoInicio) throw new BadRequestException('periodoFim deve ser posterior ao periodoInicio.');
    const intervalo = (field: string) => periodoInicio || periodoFim ? { [field]: { ...(periodoInicio ? { gte: periodoInicio } : {}), ...(periodoFim ? { lte: periodoFim } : {}) } } : {};
    const contratos = await this.prisma.contrato.findMany({
      where: await this.contratosWhere(filters, user),
      include: {
        municipio: { select: { nome: true } }, dre: { select: { nome: true } }, escola: { select: { nome: true } },
        edital: { select: { numero: true } }, produtor: { select: { nome: true } },
        itens: { where: { deletedAt: null }, select: { id: true, valorUnitario: true } },
      }, orderBy: [{ exercicio: 'desc' }, { numero: 'asc' }],
    });
    if (!contratos.length) return [];
    const ids = contratos.map((c) => c.id);
    const [entregas, notas, atestos, liquidacoes, pagamentos, docs, divergencias] = await Promise.all([
      this.prisma.entregaItem.findMany({ where: { deletedAt: null, entrega: { ...intervalo('dataEntrega'), programacao: { contratoId: { in: ids } }, status: 'ACEITA', deletedAt: null } }, select: { quantidadeAceita: true, programacaoItem: { select: { valorUnitarioContratual: true, contratoItem: { select: { contratoId: true } } } } } }),
      this.prisma.notaFiscal.findMany({ where: { ...intervalo('dataEmissao'), contratoId: { in: ids }, deletedAt: null, status: { not: 'CANCELADA' } }, select: { contratoId: true, valorTotal: true, documentos: { select: { id: true } } } }),
      this.prisma.atesto.findMany({ where: { ...intervalo('dataAtesto'), contratoId: { in: ids }, status: { in: ['ATESTADO', 'RETIFICADO'] } }, select: { contratoId: true, valorAtestado: true, hashSha256: true } }),
      this.prisma.liquidacao.findMany({ where: { ...intervalo('dataLiquidacao'), contratoId: { in: ids }, status: { not: 'CANCELADA' } }, select: { contratoId: true, valorLiquidado: true, hashSha256: true } }),
      this.prisma.pagamento.findMany({ where: { ...intervalo('dataPagamento'), contratoId: { in: ids }, status: { in: ['REGISTRADO', 'CONFIRMADO', 'PARCIAL'] } }, select: { contratoId: true, valorPago: true, comprovantePath: true } }),
      this.prisma.contratoDocumento.findMany({ where: { contratoId: { in: ids } }, select: { contratoId: true, id: true } }),
      this.prisma.divergenciaFiscal.findMany({ where: { notaFiscal: { contratoId: { in: ids } }, status: { in: ['ABERTA', 'EM_ANALISE'] } }, select: { notaFiscal: { select: { contratoId: true } } } }),
    ]);
    const soma = (rows: Array<{ contratoId: string; [key: string]: any }>, field: string, id: string) => rows.filter((r) => r.contratoId === id).reduce((a, r) => a.add(r[field] ?? 0), new Prisma.Decimal(0));
    return contratos.map((c) => {
      const recebido = entregas.filter((e) => e.programacaoItem.contratoItem.contratoId === c.id).reduce((a, e) => a.add(e.quantidadeAceita.mul(e.programacaoItem.valorUnitarioContratual)), new Prisma.Decimal(0));
      const nf = notas.filter((n) => n.contratoId === c.id);
      const faturado = nf.reduce((a, n) => a.add(n.valorTotal), new Prisma.Decimal(0));
      const pendencias = nf.filter((n) => n.documentos.length === 0).length
        + atestos.filter((a) => a.contratoId === c.id && !a.hashSha256).length
        + liquidacoes.filter((l) => l.contratoId === c.id && !l.hashSha256).length
        + pagamentos.filter((p) => p.contratoId === c.id && !p.comprovantePath).length;
      const pago = soma(pagamentos, 'valorPago', c.id);
      const contratado = new Prisma.Decimal(c.valorAtualizado);
      const liquidado = soma(liquidacoes, 'valorLiquidado', c.id);
      const financeiro = pago.eq(0) ? 'PENDENTE' : pago.lt(liquidado) ? 'PARCIAL' : 'PAGO';
      return {
        contratoId: c.id, numero: c.numero, exercicio: c.exercicio, municipio: c.municipio?.nome ?? null, dre: c.dre?.nome ?? null,
        escola: c.escola?.nome ?? null, edital: c.edital?.numero ?? null, fornecedor: c.produtor.nome,
        contratado: dinheiro(contratado), recebido: dinheiro(recebido), faturado: dinheiro(faturado),
        atestado: dinheiro(soma(atestos, 'valorAtestado', c.id)), liquidado: dinheiro(liquidado), pago: dinheiro(pago),
        saldoContratual: dinheiro(contratado.sub(recebido)), pendenciasDocumentais: pendencias,
        divergencias: divergencias.filter((d) => d.notaFiscal.contratoId === c.id).length,
        statusDocumental: pendencias ? 'PENDENTE' : 'REGULAR', statusFinanceiro: financeiro,
      };
    }).filter((l) => (!filters.statusDocumental || l.statusDocumental === filters.statusDocumental) && (!filters.statusFinanceiro || l.statusFinanceiro === filters.statusFinanceiro));
  }

  async demonstrativo(filters: PrestacaoFiltros, user?: AuthenticatedUser) {
    const linhas = await this.linhas(filters, user);
    const totals = linhas.reduce((a, l) => { for (const k of ['contratado', 'recebido', 'faturado', 'atestado', 'liquidado', 'pago', 'saldoContratual'] as const) a[k] = new Prisma.Decimal(a[k] || 0).add(l[k]); return a; }, {} as Record<string, Prisma.Decimal>);
    return { filtros: filters, geradoEm: new Date().toISOString(), indicadores: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, dinheiro(v)])), pendenciasDocumentais: linhas.reduce((a, l) => a + l.pendenciasDocumentais, 0), divergencias: linhas.reduce((a, l) => a + l.divergencias, 0), linhas };
  }

  private async prestacaoScope(user: AuthenticatedUser): Promise<Prisma.PrestacaoContasWhereInput> {
    if (user.role === 'ADMIN') return {};
    if (user.role === 'DRE') return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } };
    if (user.role === 'ESCOLA') return { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
    return { id: { in: [] } };
  }

  async listarPrestacoes(user: AuthenticatedUser) { return this.prisma.prestacaoContas.findMany({ where: await this.prestacaoScope(user), include: { dre: { select: { nome: true } }, escola: { select: { nome: true } }, documentos: { select: { id: true, tipo: true, titulo: true, createdAt: true } } }, orderBy: { updatedAt: 'desc' } }); }

  async criarPrestacao(input: { exercicio: number; periodoInicio: string; periodoFim: string; dreId?: string; escolaId?: string; observacoes?: string }, user: AuthenticatedUser) {
    if (!['ADMIN', 'DRE', 'ESCOLA'].includes(user.role)) throw new ForbiddenException('Perfil sem permissao para prestar contas.');
    const inicio = data(input.periodoInicio, 'periodoInicio')!; const fim = data(input.periodoFim, 'periodoFim')!;
    if (fim < inicio) throw new BadRequestException('periodoFim deve ser posterior ao periodoInicio.');
    if (user.role === 'DRE' && (!input.dreId || !(await this.policy.getAuthorizedDREIds(user)).includes(input.dreId))) throw new ForbiddenException('DRE fora do escopo institucional.');
    if (user.role === 'ESCOLA' && input.escolaId !== user.escolaId) throw new ForbiddenException('Escola fora do escopo institucional.');
    const criado = await this.prisma.prestacaoContas.create({ data: { exercicio: input.exercicio, periodoInicio: inicio, periodoFim: fim, dreId: input.dreId, escolaId: input.escolaId, observacoes: input.observacoes, createdBy: user.sub, updatedBy: user.sub } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CRIAR_PRESTACAO_CONTAS', entity: 'PrestacaoContas', entityId: criado.id, newValues: input });
    return criado;
  }

  async atualizarPrestacao(id: string, input: { exercicio?: number; periodoInicio?: string; periodoFim?: string; dreId?: string; escolaId?: string; observacoes?: string; versao: number }, user: AuthenticatedUser) {
    const atual = await this.prisma.prestacaoContas.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Prestacao de contas nao encontrada.');
    if (atual.status !== 'RASCUNHO' && atual.status !== 'DEVOLVIDA') throw new BadRequestException('Somente rascunhos ou devolvidas podem ser editados.');
    if (user.role !== 'ADMIN' && atual.createdBy !== user.sub) throw new ForbiddenException('Prestacao fora do escopo institucional.');
    const inicio = input.periodoInicio ? data(input.periodoInicio, 'periodoInicio')! : atual.periodoInicio;
    const fim = input.periodoFim ? data(input.periodoFim, 'periodoFim')! : atual.periodoFim;
    if (fim < inicio) throw new BadRequestException('periodoFim deve ser posterior ao periodoInicio.');
    const alterado = await this.prisma.prestacaoContas.updateMany({ where: { id, versao: input.versao, status: { in: ['RASCUNHO', 'DEVOLVIDA'] } }, data: { ...(input.exercicio !== undefined ? { exercicio: input.exercicio } : {}), periodoInicio: inicio, periodoFim: fim, ...(input.dreId !== undefined ? { dreId: input.dreId } : {}), ...(input.escolaId !== undefined ? { escolaId: input.escolaId } : {}), ...(input.observacoes !== undefined ? { observacoes: input.observacoes } : {}), versao: { increment: 1 }, updatedBy: user.sub } });
    if (alterado.count !== 1) throw new ConflictException('Prestacao alterada por outra operacao ou versao desatualizada.');
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'ALTERAR_PRESTACAO_CONTAS', entity: 'PrestacaoContas', entityId: id, oldValues: { versao: input.versao }, newValues: { ...input, versao: input.versao + 1 } });
    return this.prisma.prestacaoContas.findUnique({ where: { id } });
  }

  async transicionar(id: string, status: StatusPrestacaoContas, justificativa: string | undefined, user: AuthenticatedUser) {
    const atual = await this.prisma.prestacaoContas.findUnique({ where: { id } }); if (!atual) throw new NotFoundException('Prestacao de contas nao encontrada.');
    if (user.role !== 'ADMIN' && atual.createdBy !== user.sub) {
      if (user.role === 'DRE' && (!atual.dreId || !(await this.policy.getAuthorizedDREIds(user)).includes(atual.dreId))) throw new ForbiddenException('Prestacao fora do escopo institucional.');
      if (user.role === 'ESCOLA' && (!atual.escolaId || !(await this.policy.getAuthorizedEscolaIds(user)).includes(atual.escolaId))) throw new ForbiddenException('Prestacao fora do escopo institucional.');
      if (!['DRE', 'ESCOLA'].includes(user.role)) throw new ForbiddenException('Prestacao fora do escopo institucional.');
    }
    const permitidas: Record<string, string[]> = { RASCUNHO: ['EM_CONFERENCIA', 'CANCELADA'], EM_CONFERENCIA: ['ENVIADA', 'DEVOLVIDA'], ENVIADA: ['EM_ANALISE', 'DEVOLVIDA'], EM_ANALISE: ['APROVADA', 'DEVOLVIDA'], DEVOLVIDA: ['RASCUNHO'], APROVADA: [], CANCELADA: [] };
    if (!permitidas[atual.status].includes(status)) throw new BadRequestException(`Transicao ${atual.status} -> ${status} nao permitida.`);
    if (status === 'DEVOLVIDA' && !justificativa?.trim()) throw new BadRequestException('Justificativa obrigatoria para devolucao.');
    const agora = new Date();
    const atualizado = await this.prisma.prestacaoContas.update({ where: { id }, data: { status, justificativa: justificativa?.trim(), versao: { increment: 1 }, updatedBy: user.sub, ...(status === 'ENVIADA' ? { enviadoEm: agora } : {}), ...(status === 'EM_ANALISE' || status === 'APROVADA' ? { analisadoEm: agora } : {}), ...(status === 'APROVADA' ? { aprovadoEm: agora } : {}), ...(status === 'DEVOLVIDA' ? { devolvidoEm: agora } : {}) } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: `PRESTACAO_${status}`, entity: 'PrestacaoContas', entityId: id, oldValues: { status: atual.status }, newValues: { status, justificativa } });
    return atualizado;
  }

  async exportar(filters: PrestacaoFiltros, formato: 'csv' | 'xlsx' | 'pdf', user: AuthenticatedUser) {
    const dados = await this.demonstrativo(filters, user);
    await this.audit.log({ userId: user.sub, userRole: user.role, action: `EXPORTAR_PRESTACAO_${formato.toUpperCase()}`, entity: 'PrestacaoContas', metadata: { filtros: filters } });
    if (formato === 'csv') {
      const headers = Object.keys(dados.linhas[0] ?? { contratoId: '', numero: '' });
      const rows = dados.linhas.map((l) => headers.map((h) => JSON.stringify((l as any)[h] ?? '')).join(';'));
      return { contentType: 'text/csv; charset=utf-8', extension: 'csv', body: `\uFEFF${headers.join(';')}\n${rows.join('\n')}` };
    }
    if (formato === 'xlsx') {
      const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dados.linhas), 'Demonstrativo');
      return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx', body: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) };
    }
    const doc = new PDFDocument({ margin: 36 }); const chunks: Buffer[] = []; doc.on('data', (c: Buffer) => chunks.push(c));
    doc.fontSize(16).text('Demonstrativo de Prestacao de Contas'); doc.fontSize(9).text(`Gerado em ${new Date().toLocaleString('pt-BR')}`); doc.moveDown();
    for (const l of dados.linhas) doc.text(`${l.numero} | ${l.fornecedor} | Contratado R$ ${l.contratado} | Pago R$ ${l.pago} | Pendencias ${l.pendenciasDocumentais}`);
    doc.end(); await new Promise<void>((resolve) => doc.on('end', () => resolve()));
    return { contentType: 'application/pdf', extension: 'pdf', body: Buffer.concat(chunks) };
  }

  async transparencia(filters: PrestacaoFiltros) {
    const dados = await this.linhas(filters);
    return dados.map((l) => ({ contrato: l.numero, exercicio: l.exercicio, municipio: l.municipio, dre: l.dre, escola: l.escola, edital: l.edital, fornecedor: l.fornecedor, valorContratado: l.contratado, execucaoFinanceira: { faturado: l.faturado, pago: l.pago }, execucaoFisica: { recebido: l.recebido }, situacao: l.statusFinanceiro }));
  }
}
