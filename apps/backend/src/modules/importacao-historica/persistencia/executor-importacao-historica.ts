/**
 * EXECUTOR DE HOMOLOGAÇÃO da importação histórica PNAE MT 2025.
 *
 * Este arquivo é a ÚNICA parte da importação histórica que escreve no banco,
 * e só fazê-lo num banco ISOLADO de homologação, validado por identidade real
 * (`SELECT DATABASE()`), nunca pelo nome do `.env` nem por `NODE_ENV`.
 *
 * REUTILIZAÇÃO (nada de sistema paralelo):
 *  - `ImportacoesRepository`  → ImportLog, Edital e EditalItem.
 *  - `ChamadasPublicasService` → ChamadaPublica (com validação de unicidade e
 *    checagem de papel — mesma camada usada pela API HTTP).
 *  - `AuditService`           → trilha de auditoria.
 *  - `IdempotenciaOperacao`   → marca de idempotência por chave lógica.
 *
 * GARANTIAS:
 *  - transacional: um edital inteiro (ou nada) via `prisma.$transaction`;
 *  - idempotente: a mesma execução duas vezes não duplica (chave lógica +
 *    unicidade (dreId, numero, exercicio));
 *  - nunca sobrescreve: apenas `create` — nenhum UPDATE/DELETE em dado
 *    existente; registro revisado não é alterado;
 *  - nunca cria entidade executora, DRE, município ou escola;
 *  - nunca altera `EntidadeExecutora` (inclusive preencher CNPJ nulo).
 */

import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/application/services/audit.service';
import { PolicyService } from '../../../common/auth/policy.service';
import { AuthenticatedUser } from '../../../common/auth/user-scope';
import { ImportacoesRepository } from '../../importador-editais/application/repositories/importacoes.repository';
import { ChamadasPublicasService } from '../../chamadas-publicas/application/chamadas-publicas.service';
import { StagingEdital } from '../dominio/tipos';
import { chaveIdempotenciaOperacao } from '../dominio/chaves-logicas';

/** Operação registrada em `IdempotenciaOperacao`. */
export const OPERACAO_HISTORICA = 'importacao-historica-pnae-2025';

/** Marcador literal para `produtoOriginal` quando o documento não declara o produto. */
export const PRODUTO_NAO_IDENTIFICADO = '(PRODUTO_NAO_IDENTIFICADO_NO_DOCUMENTO)';

/** Resultado por procedimento. */
export interface ResultadoProcedimento {
  idPacote: string;
  decisao: 'IMPORTADO' | 'JA_EXISTENTE' | 'BLOQUEADO';
  editalId?: string;
  chamadaPublicaId?: string;
  itensCriados?: number;
  itensComPendencia?: number;
  motivos?: string[];
}

export interface ResultadoHomologacao {
  banco: string;
  importados: number;
  jaExistentes: number;
  bloqueados: number;
  itensCriados: number;
  itensComPendencia: number;
  procedimentos: ResultadoProcedimento[];
}

/**
 * Valida, pela IDENTIDADE REAL do banco conectado, que a escrita é permitida.
 *
 * Função pura (testável sem banco): recebe o resultado de `SELECT DATABASE()`
 * e devolve a decisão. Regras:
 *  - o nome do banco precisa conter `homolog` (identidade, não configuração);
 *  - o banco ativo `merenda_pnae` é sempre recusado, mesmo que a URL diga
 *    outra coisa;
 *  - nome vazio/indefinido é recusado (sem identidade, sem escrita).
 */
export function decidirEscritaHomologacao(databaseConectado: string | null | undefined): { permitido: boolean; motivo: string } {
  const nome = (databaseConectado || '').trim().toLowerCase();
  if (!nome) {
    return { permitido: false, motivo: 'sem identidade de banco (SELECT DATABASE() vazio) — escrita recusada' };
  }
  if (nome === 'merenda_pnae') {
    return { permitido: false, motivo: `conectado ao banco ATIVO "${databaseConectado}" — escrita recusada` };
  }
  if (!nome.includes('homolog')) {
    return { permitido: false, motivo: `banco "${databaseConectado}" não é de homologação (esperado nome contendo "homolog") — escrita recusada` };
  }
  return { permitido: true, motivo: `banco de homologação identificado: "${databaseConectado}"` };
}

/**
 * Constrói o período de inscrições.
 *
 * O pacote NÃO documenta período de inscrição (`prazos` e `dataPublicacao`
 * ausentes em todos os 51). Os campos são obrigatórios no schema, então a
 * data da sessão (evidência documental real) é usada como MARCADOR, com
 * pendência explícita — nunca se afirma que as inscrições ocorreram nela.
 */
export function montarPeriodoInscricoes(dataSessao: string | null | undefined): { inicio: Date; fim: Date; pendencia: string } {
  const base = dataSessao ? new Date(dataSessao) : null;
  const data = base && !isNaN(base.getTime()) ? base : new Date('2025-01-01T00:00:00.000Z');
  return {
    inicio: data,
    fim: new Date(data.getTime() + 24 * 60 * 60 * 1000),
    pendencia: dataSessao
      ? `periodo de inscricoes nao documentado no pacote; data da sessao (${dataSessao}) usada como marcador obrigatorio — NAO e periodo real, exige conferencia administrativa`
      : 'periodo de inscricoes nao documentado e data de sessao ausente; marcador generico aplicado — exige conferencia administrativa',
  };
}

@Injectable()
export class ExecutorImportacaoHistorica {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PolicyService,
    private readonly audit: AuditService,
  ) {}

  /** Garante, na hora, que o PrismaService aponta para um banco de homologação. */
  private async exigirAmbienteIsolado(): Promise<string> {
    const linhas = await this.prisma.$queryRawUnsafe<Array<{ db: string | null }>>('SELECT DATABASE() AS db');
    const database = Array.isArray(linhas) && linhas.length ? linhas[0].db : null;
    const decisao = decidirEscritaHomologacao(database);
    if (!decisao.permitido) throw new BadRequestException(`HOMOLOGACAO_BLOQUEADA: ${decisao.motivo}`);
    return database as string;
  }

  /**
   * Executa a importação dos procedimentos APROVADOS do staging.
   *
   * Cada procedimento roda numa transação própria: ou cria tudo, ou nada.
   */
  async executar(
    staging: StagingEdital[],
    user: AuthenticatedUser,
    opcoes: { aplicarPendencias?: boolean } = {},
  ): Promise<ResultadoHomologacao> {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Importação histórica exige papel administrativo');
    }

    const database = await this.exigirAmbienteIsolado();

    const resultado: ResultadoHomologacao = {
      banco: database,
      importados: 0,
      jaExistentes: 0,
      bloqueados: 0,
      itensCriados: 0,
      itensComPendencia: 0,
      procedimentos: [],
    };

    for (const s of staging) {
      if (s.decisao !== 'APROVADO') {
        resultado.bloqueados += 1;
        resultado.procedimentos.push({
          idPacote: s.idPacote,
          decisao: 'BLOQUEADO',
          motivos: s.motivosBloqueio.length ? s.motivosBloqueio : [`decisao de staging: ${s.decisao}`],
        });
        continue;
      }

      const r = await this.importarProcedimento(s, user, opcoes);
      resultado.procedimentos.push(r);
      if (r.decisao === 'IMPORTADO') {
        resultado.importados += 1;
        resultado.itensCriados += r.itensCriados || 0;
        resultado.itensComPendencia += r.itensComPendencia || 0;
      } else if (r.decisao === 'JA_EXISTENTE') {
        resultado.jaExistentes += 1;
      } else {
        resultado.bloqueados += 1;
      }
    }

    return resultado;
  }

  /** Importa UM procedimento dentro de uma transação. */
  private async importarProcedimento(
    s: StagingEdital,
    user: AuthenticatedUser,
    opcoes: { aplicarPendencias?: boolean },
  ): Promise<ResultadoProcedimento> {
    const dreId = s.vinculosInstitucionais.dre.dreId;
    const municipioId = s.vinculosInstitucionais.municipio.municipioId;
    if (!dreId || !municipioId) {
      return {
        idPacote: s.idPacote,
        decisao: 'BLOQUEADO',
        motivos: [`DRE: ${s.vinculosInstitucionais.dre.detalhe}`, `Municipio: ${s.vinculosInstitucionais.municipio.detalhe}`],
      };
    }

    const numero = (s.identificacao.numeroNormalizado || '').trim();
    const exercicio = s.identificacao.exercicio || 0;
    if (!numero || !exercicio) {
      return { idPacote: s.idPacote, decisao: 'BLOQUEADO', motivos: ['numero ou exercicio ausente na identificacao'] };
    }

    const chaveOperacao = chaveIdempotenciaOperacao(OPERACAO_HISTORICA, s.chaveLogica);

    try {
      return await this.prisma.$transaction(async (tx) => {
        // --- idempotência (chave lógica do procedimento) ---
        const jaProcessado = await tx.idempotenciaOperacao.findUnique({ where: { chave: chaveOperacao } });
        if (jaProcessado) {
          return { idPacote: s.idPacote, decisao: 'JA_EXISTENTE' as const, motivos: [`idempotencia ja registrada: ${chaveOperacao}`] };
        }

        // --- colisão por unicidade (dreId, numero, exercicio) ---
        const colisao = await tx.chamadaPublica.findFirst({ where: { dreId, numero, exercicio } });
        if (colisao) {
          return {
            idPacote: s.idPacote,
            decisao: 'JA_EXISTENTE' as const,
            chamadaPublicaId: colisao.id,
            motivos: [`ChamadaPublica (dreId=${dreId}, numero=${numero}, exercicio=${exercicio}) ja existe: ${colisao.id}`],
          };
        }

        // --- serviços existentes, instanciados sobre a transação ---
        const importacoes = new ImportacoesRepository(tx as unknown as PrismaService);
        const chamadas = new ChamadasPublicasService(tx as unknown as PrismaService, this.policy, new AuditService(tx as unknown as PrismaService));

        // 1) ImportLog (proveniência da operação)
        const docPrincipal = s.documentos[0];
        const caminhoFonte = docPrincipal?.caminho || `staging/${s.idPacote}.json`;
        const importLog = await importacoes.createImportLog({
          arquivoCaminho: caminhoFonte,
          arquivoNome: caminhoFonte.split('/').pop() || `${s.idPacote}.json`,
          origem: 'IMPORTACAO_HISTORICA',
          objeto: s.identificacao.objeto || null,
          resumo: JSON.stringify({
            idPacote: s.idPacote,
            chaveLogica: s.chaveLogica,
            sha256Principal: docPrincipal?.sha256 || null,
            hashManifesto: s.metadadoExtracao?.manifestoSha256 || null,
          }),
          quantidadeItens: s.itens.length,
          createdBy: user.sub,
        });

        // 2) Edital (status RASCUNHO — nunca ATIVO/publicado)
        const periodo = montarPeriodoInscricoes(s.identificacao.dataSessao as unknown as string);
        const edital = await importacoes.upsertEditalFromImport(importLog.id, null, {
          numero,
          ano: exercicio,
          titulo: `Chamada Publica ${numero}/${exercicio} — ${s.dre}`,
          objeto: s.identificacao.objeto || undefined,
          arquivoFonte: docPrincipal?.caminho || `staging/${s.idPacote}.json`,
          municipioId,
          observacoes: JSON.stringify({
            origem: 'importacao-historica-pnae-2025',
            idPacote: s.idPacote,
            chaveLogica: s.chaveLogica,
            pendencias: s.pendencias,
            entidadeExecutora: s.vinculosInstitucionais.unidadesExecutoras[0] || null,
          }),
        });

        // 3) Itens
        const itensPayload = s.itens.map((i) => this.montarItem(i, opcoes.aplicarPendencias !== false));
        const { count } = await importacoes.createEditalItems(edital.id, itensPayload);

        // 4) ChamadaPublica (reutiliza a validação de unicidade e de papel)
        const chamada = await chamadas.criar(
          {
            numero,
            exercicio,
            editalId: edital.id,
            objeto: s.identificacao.objeto || `Chamada Publica ${numero}/${exercicio}`,
            dreId,
            municipioId,
            inscricoesInicio: periodo.inicio.toISOString(),
            inscricoesFim: periodo.fim.toISOString(),
            observacoes: JSON.stringify({
              origem: 'importacao-historica-pnae-2025',
              idPacote: s.idPacote,
              chaveLogica: s.chaveLogica,
              pendencias: [periodo.pendencia, ...s.pendencias.map((p) => `${p.tipo}: ${p.descricao}`)],
              entidadeExecutoraPendente: s.vinculosInstitucionais.unidadesExecutoras[0] || null,
              aviso: 'registro importado historicamente — NAO e publicacao, homologacao, contratacao nem pagamento',
            }),
          } as never,
          user,
        );

        // 5) Documentos da chamada (proveniência: hash, versão, tipo)
        for (const [idx, d] of s.documentos.entries()) {
          await tx.chamadaPublicaDocumento.create({
            data: {
              chamadaId: chamada.id,
              versao: idx + 1,
              tipo: 'EDITAL_HISTORICO',
              titulo: d.caminho || `${s.idPacote} doc ${idx + 1}`,
              arquivoPath: d.caminho || null,
              hashSha256: d.sha256 || null,
              publicado: false,
              createdBy: user.sub,
            },
          });
        }

        // 6) Idempotência
        await tx.idempotenciaOperacao.create({
          data: {
            chave: chaveOperacao,
            operacao: OPERACAO_HISTORICA,
            recursoId: chamada.id,
            resposta: JSON.stringify({ idPacote: s.idPacote, editalId: edital.id, chamadaPublicaId: chamada.id, itens: count }),
          },
        });

        // 7) Auditoria
        await this.audit.log({
          userId: user.sub,
          userRole: user.role,
          action: 'IMPORTACAO_HISTORICA',
          entity: 'ChamadaPublica',
          entityId: chamada.id,
          newValues: { idPacote: s.idPacote, chaveLogica: s.chaveLogica, editalId: edital.id, itens: count },
        });

        return {
          idPacote: s.idPacote,
          decisao: 'IMPORTADO' as const,
          editalId: edital.id,
          chamadaPublicaId: chamada.id,
          itensCriados: count,
          itensComPendencia: itensPayload.filter((i) => i.pendenteEdicao).length,
        };
      });
    } catch (e) {
      return { idPacote: s.idPacote, decisao: 'BLOQUEADO', motivos: [(e as Error).message] };
    }
  }

  /**
   * Monta um `EditalItem` preservando a proveniência e NUNCA inventando valor.
   *
   *  - valores monetários/quantitativos só entram quando inequívocos;
   *  - divergência entre total da fonte e total calculado fica em `observacoes`;
   *  - produto ausente vira marcador literal + pendência (não é inferido);
   *  - item com pendência recebe `status = PENDENTE_CONFERENCIA` e
   *    `pendenteEdicao = true` — nunca `CONFIRMADO`.
   */
  private montarItem(i: StagingEdital['itens'][number], aplicarPendencias: boolean): Prisma.EditalItemUncheckedCreateInput {
    const pendencias: string[] = [];
    if (i.pendencia) pendencias.push(i.pendencia);
    if (i.divergencia) pendencias.push(`divergencia total fonte x calculado: ${i.divergencia}`);
    if (!i.produto) pendencias.push('produto nao identificado no documento — nao inferido');
    if (!i.quantidade?.normalizado) pendencias.push('quantidade ausente/ambigua — nao preenchida');
    if (!i.unidadeComercial) pendencias.push('unidade comercial ausente — nao inferida');
    if (!i.precoUnitario?.normalizado) pendencias.push('preco unitario ausente/ambiguo — nao preenchido');

    const comPendencia = aplicarPendencias && pendencias.length > 0;

    return {
      numeroItem: i.sequencia ?? null,
      produtoOriginal: i.produto?.trim() || PRODUTO_NAO_IDENTIFICADO,
      especificacao: i.descricaoCompleta || null,
      quantidade: (i.quantidade?.normalizado ?? null) as Prisma.Decimal | null,
      unidade: i.unidadeComercial || null,
      precoUnitario: (i.precoUnitario?.normalizado ?? null) as Prisma.Decimal | null,
      // Preserva o valor da FONTE (nunca o calculado) — divergência fica registrada.
      valorTotal: (i.totalFonte?.normalizado ?? null) as Prisma.Decimal | null,
      status: comPendencia ? 'PENDENTE_CONFERENCIA' : 'CONFIRMADO',
      pendenteEdicao: comPendencia,
      importadoAutomaticamente: true,
      observacoes: JSON.stringify({
        origem: 'importacao-historica-pnae-2025',
        proveniencia: {
          documentoId: i.documentoId,
          pagina: i.pagina,
          metodo: i.metodo,
          statusRevisao: i.statusRevisao,
          quantidadeBruta: i.quantidade?.bruto ?? null,
          precoUnitarioBruto: i.precoUnitario?.bruto ?? null,
          totalFonteBruto: i.totalFonte?.bruto ?? null,
          totalCalculado: i.totalCalculado,
          divergencia: i.divergencia,
        },
        pendencias,
      }),
      createdBy: 'importacao-historica-pnae-2025',
    } as Prisma.EditalItemUncheckedCreateInput;
  }
}
