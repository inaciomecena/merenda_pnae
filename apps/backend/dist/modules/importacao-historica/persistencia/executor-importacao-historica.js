"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutorImportacaoHistorica = exports.PRODUTO_NAO_IDENTIFICADO = exports.OPERACAO_HISTORICA = void 0;
exports.decidirEscritaHomologacao = decidirEscritaHomologacao;
exports.montarPeriodoInscricoes = montarPeriodoInscricoes;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../audit/application/services/audit.service");
const policy_service_1 = require("../../../common/auth/policy.service");
const importacoes_repository_1 = require("../../importador-editais/application/repositories/importacoes.repository");
const chamadas_publicas_service_1 = require("../../chamadas-publicas/application/chamadas-publicas.service");
const chaves_logicas_1 = require("../dominio/chaves-logicas");
exports.OPERACAO_HISTORICA = 'importacao-historica-pnae-2025';
exports.PRODUTO_NAO_IDENTIFICADO = '(PRODUTO_NAO_IDENTIFICADO_NO_DOCUMENTO)';
function decidirEscritaHomologacao(databaseConectado) {
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
function montarPeriodoInscricoes(dataSessao) {
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
let ExecutorImportacaoHistorica = class ExecutorImportacaoHistorica {
    prisma;
    policy;
    audit;
    constructor(prisma, policy, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.audit = audit;
    }
    async exigirAmbienteIsolado() {
        const linhas = await this.prisma.$queryRawUnsafe('SELECT DATABASE() AS db');
        const database = Array.isArray(linhas) && linhas.length ? linhas[0].db : null;
        const decisao = decidirEscritaHomologacao(database);
        if (!decisao.permitido)
            throw new common_1.BadRequestException(`HOMOLOGACAO_BLOQUEADA: ${decisao.motivo}`);
        return database;
    }
    async executar(staging, user, opcoes = {}) {
        if (user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Importação histórica exige papel administrativo');
        }
        const database = await this.exigirAmbienteIsolado();
        const resultado = {
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
            }
            else if (r.decisao === 'JA_EXISTENTE') {
                resultado.jaExistentes += 1;
            }
            else {
                resultado.bloqueados += 1;
            }
        }
        return resultado;
    }
    async importarProcedimento(s, user, opcoes) {
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
        const chaveOperacao = (0, chaves_logicas_1.chaveIdempotenciaOperacao)(exports.OPERACAO_HISTORICA, s.chaveLogica);
        try {
            return await this.prisma.$transaction(async (tx) => {
                const jaProcessado = await tx.idempotenciaOperacao.findUnique({ where: { chave: chaveOperacao } });
                if (jaProcessado) {
                    return { idPacote: s.idPacote, decisao: 'JA_EXISTENTE', motivos: [`idempotencia ja registrada: ${chaveOperacao}`] };
                }
                const colisao = await tx.chamadaPublica.findFirst({ where: { dreId, numero, exercicio } });
                if (colisao) {
                    return {
                        idPacote: s.idPacote,
                        decisao: 'JA_EXISTENTE',
                        chamadaPublicaId: colisao.id,
                        motivos: [`ChamadaPublica (dreId=${dreId}, numero=${numero}, exercicio=${exercicio}) ja existe: ${colisao.id}`],
                    };
                }
                const importacoes = new importacoes_repository_1.ImportacoesRepository(tx);
                const chamadas = new chamadas_publicas_service_1.ChamadasPublicasService(tx, this.policy, new audit_service_1.AuditService(tx));
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
                const periodo = montarPeriodoInscricoes(s.identificacao.dataSessao);
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
                const itensPayload = s.itens.map((i) => this.montarItem(i, opcoes.aplicarPendencias !== false));
                const { count } = await importacoes.createEditalItems(edital.id, itensPayload);
                const chamada = await chamadas.criar({
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
                }, user);
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
                await tx.idempotenciaOperacao.create({
                    data: {
                        chave: chaveOperacao,
                        operacao: exports.OPERACAO_HISTORICA,
                        recursoId: chamada.id,
                        resposta: JSON.stringify({ idPacote: s.idPacote, editalId: edital.id, chamadaPublicaId: chamada.id, itens: count }),
                    },
                });
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
                    decisao: 'IMPORTADO',
                    editalId: edital.id,
                    chamadaPublicaId: chamada.id,
                    itensCriados: count,
                    itensComPendencia: itensPayload.filter((i) => i.pendenteEdicao).length,
                };
            });
        }
        catch (e) {
            return { idPacote: s.idPacote, decisao: 'BLOQUEADO', motivos: [e.message] };
        }
    }
    montarItem(i, aplicarPendencias) {
        const pendencias = [];
        if (i.pendencia)
            pendencias.push(i.pendencia);
        if (i.divergencia)
            pendencias.push(`divergencia total fonte x calculado: ${i.divergencia}`);
        if (!i.produto)
            pendencias.push('produto nao identificado no documento — nao inferido');
        if (!i.quantidade?.normalizado)
            pendencias.push('quantidade ausente/ambigua — nao preenchida');
        if (!i.unidadeComercial)
            pendencias.push('unidade comercial ausente — nao inferida');
        if (!i.precoUnitario?.normalizado)
            pendencias.push('preco unitario ausente/ambiguo — nao preenchido');
        const comPendencia = aplicarPendencias && pendencias.length > 0;
        return {
            numeroItem: i.sequencia ?? null,
            produtoOriginal: i.produto?.trim() || exports.PRODUTO_NAO_IDENTIFICADO,
            especificacao: i.descricaoCompleta || null,
            quantidade: (i.quantidade?.normalizado ?? null),
            unidade: i.unidadeComercial || null,
            precoUnitario: (i.precoUnitario?.normalizado ?? null),
            valorTotal: (i.totalFonte?.normalizado ?? null),
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
        };
    }
};
exports.ExecutorImportacaoHistorica = ExecutorImportacaoHistorica;
exports.ExecutorImportacaoHistorica = ExecutorImportacaoHistorica = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        policy_service_1.PolicyService,
        audit_service_1.AuditService])
], ExecutorImportacaoHistorica);
//# sourceMappingURL=executor-importacao-historica.js.map