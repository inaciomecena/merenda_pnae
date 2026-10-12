/**
 * SDD-005 — Validação ponta a ponta em AMBIENTE ISOLADO (banco merenda_pnae_sdd005,
 * servidor próprio na porta 3100). Não escreve no banco ativo.
 *
 * Fluxo: bootstrap institucional → vínculos → upload XML → conciliação →
 * conferência → atesto → liquidação → pagamentos (parcial/integral/estorno/
 * concorrência) → dashboard → operação 100% manual (cadastro manual, correção,
 * vínculo de recebimentos, liquidação/pagamento com referências), com
 * verificação de segregação de funções, isolamento institucional,
 * idempotência e consistência de saldos.
 *
 * Uso: node dist/../scripts? Não — rode com ts-node apontando E2E_BASE:
 *   $env:E2E_BASE='http://localhost:3100/api/v1'
 *   $env:BOOTSTRAP_ADMIN_TOKEN='...'
 *   npx ts-node scripts/e2e-sdd005-run.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const BASE = process.env.E2E_BASE ?? 'http://localhost:3100/api/v1';
const TOKEN_BOOTSTRAP = process.env.BOOTSTRAP_ADMIN_TOKEN ?? 'sdd005-e2e-bootstrap-2026';

interface Contexto {
  contratoId: string;
  fornecedorId: string;
  contratoItemId: string;
  entregaId: string;
  entregaItemId: string;
  dreAId: string;
  dreBId: string;
  escolaId: string;
  municipioId: string;
  users: Record<string, string>;
}
const ctx: Contexto = JSON.parse(
  fs.readFileSync(path.join(__dirname, '.e2e-sdd005-context.json'), 'utf8'),
);

type Resultado = { grupo: string; caso: string; esperado: string; obtido: string; ok: boolean };
const resultados: Resultado[] = [];

function registrar(grupo: string, caso: string, esperado: string, obtido: string, ok: boolean) {
  resultados.push({ grupo, caso, esperado, obtido, ok });
  console.log(`${ok ? '  [OK]    ' : '  [FALHA] '} ${caso} — esperado: ${esperado} | obtido: ${obtido}`);
}

async function req(
  metodo: string,
  rota: string,
  token?: string,
  json?: unknown,
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (json !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(`${BASE}${rota}`, {
    method: metodo,
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function login(email: string): Promise<string> {
  const r = await req('POST', '/auth/login', undefined, { email, password: 'Admin@123' });
  const token = r.body?.data?.accessToken;
  if (!token) throw new Error(`Login falhou para ${email}: HTTP ${r.status} ${JSON.stringify(r.body)}`);
  return token as string;
}

function multipart(
  campos: Record<string, string>,
  arquivo: { campo: string; nome: string; tipo: string; dados: Buffer },
): { contentType: string; body: Buffer } {
  const boundary = `----sdd005e2e${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const partes: Buffer[] = [];
  for (const [k, v] of Object.entries(campos)) {
    partes.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  partes.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${arquivo.campo}"; filename="${arquivo.nome}"\r\nContent-Type: ${arquivo.tipo}\r\n\r\n`,
    ),
  );
  partes.push(arquivo.dados);
  partes.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return { contentType: `multipart/form-data; boundary=${boundary}`, body: Buffer.concat(partes) };
}

async function uploadXml(token: string, xml: Buffer): Promise<{ status: number; body: any }> {
  const form = multipart(
    { tipo: 'XML', contratoId: ctx.contratoId, fornecedorId: ctx.fornecedorId },
    { campo: 'arquivo', nome: 'nfe.xml', tipo: 'application/xml', dados: xml },
  );
  const res = await fetch(`${BASE}/notas-fiscais/upload`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': form.contentType },
    body: new Uint8Array(form.body),
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

/** Gera chave de acesso NF-e de 44 dígitos (mod 55) com DV válido e unicidade por execução. */
function chaveNfeUnica(): string {
  const fixo = '5126101234567800019555'; // posições 20-21 = '55' (modelo NF-e exigido pelo parser)
  let meio = '';
  for (let i = 0; i < 21; i++) meio += Math.floor(Math.random() * 10);
  const base = (fixo + meio).slice(0, 43);
  let soma = 0;
  let peso = 2;
  for (let i = base.length - 1; i >= 0; i--) {
    soma += Number(base[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return base + (resto < 2 ? '0' : String(11 - resto));
}

function xmlNfe(chave: string): Buffer {
  return Buffer.from(
    `<NFe><infNFe Id="NFe${chave}"><ide><nNF>1</nNF><serie>1</serie><mod>55</mod><dhEmi>2026-10-11T09:00:00-04:00</dhEmi></ide><emit><CNPJ>12345678000195</CNPJ><xNome>Fornecedor Teste SDD-005</xNome></emit><dest><CNPJ>12345678000195</CNPJ></dest><det nItem="1"><prod><cProd>A</cProd><xProd>Arroz</xProd><uCom>KG</uCom><qCom>1.2500</qCom><vUnCom>10.0000</vUnCom><vProd>12.50</vProd></prod></det><total><ICMSTot><vProd>12.50</vProd><vNF>12.50</vNF></ICMSTot></total></infNFe></NFe>`,
  );
}

async function principal() {
  console.log(`\n=== SDD-005 E2E — ${BASE} ===\n`);

  const admin = await login('admin@seaf.gov.br');
  const dreBUser = await login('dre@seaf.gov.br');
  const dreAUser = await login('dre-a@seaf.gov.br');
  const escolaUser = await login('escola@seaf.gov.br');
  const extUser = await login('extensionista@seaf.gov.br');

  let notaId = '';
  let escolaVinculoId = '';

  // ── A. Bootstrap institucional ──────────────────────────────────────────
  console.log('\n-- A. Bootstrap institucional --');
  {
    const r = await req('GET', '/notas-fiscais', admin);
    registrar(
      'A',
      'A1 ADMIN global é autorizado sem vínculo institucional (papel global, sem escopo)',
      '200',
      String(r.status),
      r.status === 200,
    );

    const ruim = await req('POST', '/vinculos/bootstrap', admin, { token: 'token-invalido' });
    registrar('A', 'A2 bootstrap com token inválido é recusado', '403', String(ruim.status), ruim.status === 403);

    const semToken = await req('POST', '/vinculos/bootstrap', admin, { token: '' });
    registrar('A', 'A3 bootstrap sem token é recusado (validação)', '400', String(semToken.status), semToken.status === 400);

    const bom = await req('POST', '/vinculos/bootstrap', admin, { token: TOKEN_BOOTSTRAP });
    const vinculoAdmin = bom.body?.data;
    registrar(
      'A',
      'A4 primeiro bootstrap autorizado cria vínculo ADMIN global',
      '2xx + funcao=ADMIN sem escopo',
      `HTTP ${bom.status} funcao=${vinculoAdmin?.funcao} dreId=${vinculoAdmin?.dreId ?? 'null'} escolaId=${vinculoAdmin?.escolaId ?? 'null'}`,
      bom.status < 300 && vinculoAdmin?.funcao === 'ADMIN' && !vinculoAdmin?.dreId && !vinculoAdmin?.escolaId && !vinculoAdmin?.produtorId,
    );

    const repetir = await req('POST', '/vinculos/bootstrap', admin, { token: TOKEN_BOOTSTRAP });
    registrar('A', 'A5 repetir o bootstrap é recusado (execução única)', '409', String(repetir.status), repetir.status === 409);

    const escala = await req('POST', '/vinculos/bootstrap', escolaUser, { token: TOKEN_BOOTSTRAP });
    registrar('A', 'A6 escalonamento: ESCOLA é recusado mesmo com token correto', '403', String(escala.status), escala.status === 403);

    const depois = await req('GET', '/notas-fiscais', admin);
    registrar('A', 'A7 ADMIN com vínculo ativo é autorizado', '200', String(depois.status), depois.status === 200);
  }

  // ── B. Vínculos institucionais ──────────────────────────────────────────
  console.log('\n-- B. Vínculos institucionais --');
  {
    const semVinculo = await req('GET', '/notas-fiscais', dreAUser);
    registrar('B', 'B1 DRE sem vínculo institucional é bloqueado', '403', String(semVinculo.status), semVinculo.status === 403);

    const vigencia = new Date(Date.now() - 86400000).toISOString();
    const criarDreB = await req('POST', '/vinculos', admin, {
      userId: ctx.users['dre@seaf.gov.br'], funcao: 'DRE', dreId: ctx.dreBId, vigenciaInicio: vigencia,
    });
    registrar('B', 'B2 vínculo DRE-B criado (fora do escopo do contrato)', '2xx', String(criarDreB.status), criarDreB.status < 300);

    const criarDreA = await req('POST', '/vinculos', admin, {
      userId: ctx.users['dre-a@seaf.gov.br'], funcao: 'DRE', dreId: ctx.dreAId, vigenciaInicio: vigencia,
    });
    registrar('B', 'B3 vínculo DRE-A criado (escopo do contrato)', '2xx', String(criarDreA.status), criarDreA.status < 300);

    const criarEscola = await req('POST', '/vinculos', admin, {
      userId: ctx.users['escola@seaf.gov.br'], funcao: 'ESCOLA', escolaId: ctx.escolaId, vigenciaInicio: vigencia,
    });
    registrar('B', 'B4 vínculo ESCOLA criado', '2xx + id', `HTTP ${criarEscola.status} id=${criarEscola.body?.data?.id ?? '-'}`, criarEscola.status < 300);

    // RolesGuard exige municipioId em vínculos EXTENSIONISTA (regra de domínio).
    const criarExt = await req('POST', '/vinculos', admin, {
      userId: ctx.users['extensionista@seaf.gov.br'], funcao: 'EXTENSIONISTA', municipioId: ctx.municipioId, vigenciaInicio: vigencia,
    });
    registrar('B', 'B5 vínculo EXTENSIONISTA criado', '2xx', String(criarExt.status), criarExt.status < 300);

    const dreSemEscopo = await req('POST', '/vinculos', admin, {
      userId: ctx.users['dre@seaf.gov.br'], funcao: 'DRE', vigenciaInicio: vigencia,
    });
    registrar('B', 'B6 vínculo DRE sem dreId é recusado', '400', String(dreSemEscopo.status), dreSemEscopo.status === 400);

    const adminRepetido = await req('POST', '/vinculos', admin, {
      userId: ctx.users['admin@seaf.gov.br'], funcao: 'ADMIN', vigenciaInicio: vigencia,
    });
    registrar('B', 'B7 vínculo ADMIN duplicado é recusado (sobreposição)', '400', String(adminRepetido.status), adminRepetido.status === 400);

    escolaVinculoId = criarEscola.body?.data?.id ?? '';
    registrar('B', 'B8 id do vínculo ESCOLA capturado para o teste de revogação', 'id presente', escolaVinculoId || '(ausente)', !!escolaVinculoId);
  }

  // ── C. Upload da NF-e e duplicidade ─────────────────────────────────────
  console.log('\n-- C. Upload XML --');
  const xml = xmlNfe(chaveNfeUnica());
  {
    const up = await uploadXml(admin, xml);
    notaId = up.body?.data?.id ?? '';
    registrar('C', 'C1 upload XML cria a nota (status PROCESSADA)', '2xx + id', `HTTP ${up.status} id=${notaId}`, up.status < 300 && !!notaId);

    const det = await req('GET', `/notas-fiscais/${notaId}`, admin);
    const nota = det.body?.data;
    registrar(
      'C',
      'C2 nota detalhada: PROCESSADA, 1 item, valorTotal 12.50, fornecedor vinculado',
      'PROCESSADA / 1 item / 12.50',
      `${nota?.status} / ${nota?.itens?.length} item(s) / ${nota?.valorTotal} / ${nota?.fornecedor?.nome ?? '-'}`,
      nota?.status === 'PROCESSADA' && nota?.itens?.length === 1 && Math.abs(Number(nota?.valorTotal) - 12.5) < 0.001 && nota?.fornecedor?.id === ctx.fornecedorId,
    );

    const dup = await uploadXml(admin, xml);
    registrar('C', 'C3 reenvio do mesmo XML é recusado (chave duplicada)', '409', String(dup.status), dup.status === 409);

    const extUpload = await uploadXml(extUser, xmlNfe(chaveNfeUnica()));
    registrar('C', 'C4 upload por EXTENSIONISTA é recusado (papel)', '403', String(extUpload.status), extUpload.status === 403);
  }

  // ── D. Segregação de funções e isolamento institucional ────────────────
  console.log('\n-- D. Segregação de funções e escopo --');
  {
    const dreBConciliar = await req('POST', `/notas-fiscais/${notaId}/conciliar`, dreBUser);
    registrar('D', 'D1 DRE de outra instituição não concilia (fora do escopo)', '403', String(dreBConciliar.status), dreBConciliar.status === 403);

    const escolaConciliar = await req('POST', `/notas-fiscais/${notaId}/conciliar`, escolaUser);
    registrar('D', 'D2 ESCOLA não concilia (papel não financeiro na rota)', '403', String(escolaConciliar.status), escolaConciliar.status === 403);

    const extConciliar = await req('POST', `/notas-fiscais/${notaId}/conciliar`, extUser);
    registrar('D', 'D3 EXTENSIONISTA não concilia (papel)', '403', String(extConciliar.status), extConciliar.status === 403);

    const listaDreA = await req('GET', '/notas-fiscais', dreAUser);
    const listaDreB = await req('GET', '/notas-fiscais', dreBUser);
    registrar(
      'D',
      'D4 isolamento de listagem: DRE-A vê a nota; DRE-B não',
      'DRE-A ≥1 item; DRE-B 0 itens',
      `DRE-A=${listaDreA.body?.data?.items?.length}; DRE-B=${listaDreB.body?.data?.items?.length}`,
      (listaDreA.body?.data?.items?.length ?? 0) >= 1 && (listaDreB.body?.data?.items?.length ?? 0) === 0,
    );

    const listaExt = await req('GET', '/notas-fiscais', extUser);
    registrar(
      'D',
      'D5 EXTENSIONISTA sem escopo de produtor vê lista vazia',
      '200 + 0 itens',
      `HTTP ${listaExt.status} itens=${listaExt.body?.data?.items?.length}`,
      listaExt.status === 200 && (listaExt.body?.data?.items?.length ?? -1) === 0,
    );
  }

  // ── E. Conciliação fiscal ───────────────────────────────────────────────
  console.log('\n-- E. Conciliação --');
  {
    const conc = await req('POST', `/notas-fiscais/${notaId}/conciliar`, dreAUser);
    const dados = conc.body?.data;
    registrar(
      'E',
      'E1 DRE-A (escopo correto) concilia: PENDENTE_CONFERENCIA + CONCILIADA_COM_RESSALVAS',
      '2xx / PENDENTE_CONFERENCIA / CONCILIADA_COM_RESSALVAS',
      `HTTP ${conc.status} / ${dados?.status} / ${dados?.resultadoConciliacao}`,
      conc.status < 300 && dados?.status === 'PENDENTE_CONFERENCIA' && dados?.resultadoConciliacao === 'CONCILIADA_COM_RESSALVAS',
    );

    // O registro cru devolvido por conciliar não inclui divergências; elas ficam
    // persistidas em DivergenciaFiscal e aparecem no detalhe (conciliacao.divergencias).
    const detalhe = await req('GET', `/notas-fiscais/${notaId}`, admin);
    const divs = detalhe.body?.data?.conciliacao?.divergencias ?? detalhe.body?.data?.divergencias ?? [];
    const tipos = divs.map((d: any) => `${d.tipo}:${d.severidade}:${d.status}`);
    registrar(
      'E',
      'E2 divergências persistidas são médias e esperadas (item sem vínculo + recebimento não confirmado)',
      '2 divergências MEDIA ABERTA (PRODUTO_DIVERGENTE, RECEBIMENTO_NAO_CONFIRMADO)',
      tipos.join(' | ') || '(nenhuma)',
      tipos.length === 2 && tipos.every((t: string) => t.endsWith('MEDIA:ABERTA')) && tipos.some((t: string) => t.startsWith('PRODUTO_DIVERGENTE')) && tipos.some((t: string) => t.startsWith('RECEBIMENTO_NAO_CONFIRMADO')),
    );

    const rerun = await req('POST', `/notas-fiscais/${notaId}/conciliar`, admin);
    registrar(
      'E',
      'E3 reexecução da conciliação é estável (idempotência operacional)',
      '2xx + status segue PENDENTE_CONFERENCIA',
      `HTTP ${rerun.status} / ${rerun.body?.data?.status}`,
      rerun.status < 300 && rerun.body?.data?.status === 'PENDENTE_CONFERENCIA',
    );
  }

  // ── F. Conferência documental ───────────────────────────────────────────
  console.log('\n-- F. Conferência --');
  {
    const escolaConf = await req('POST', `/notas-fiscais/${notaId}/conferencia`, escolaUser, { acao: 'APROVAR' });
    registrar('F', 'F1 ESCOLA não registra conferência (papel)', '403', String(escolaConf.status), escolaConf.status === 403);

    const dreBConf = await req('POST', `/notas-fiscais/${notaId}/conferencia`, dreBUser, { acao: 'APROVAR' });
    registrar('F', 'F2 DRE-B fora do escopo não registra conferência', '403', String(dreBConf.status), dreBConf.status === 403);

    const aprovar = await req('POST', `/notas-fiscais/${notaId}/conferencia`, admin, {
      acao: 'APROVAR',
      checklist: [
        { item: 'XML íntegro e legível', conforme: true },
        { item: 'Contrato vigente conferido', conforme: true },
      ],
      ressalvas: 'Recebimento físico não vinculado no sistema (E2E SDD-005).',
    });
    const conf = aprovar.body?.data;
    const detPosConf = await req('GET', `/notas-fiscais/${notaId}`, admin);
    const statusNotaPosConf = detPosConf.body?.data?.status;
    registrar(
      'F',
      'F3 aprovação da conferência move a nota para AGUARDANDO_ATESTO',
      '2xx (registro APROVADO) + nota AGUARDANDO_ATESTO',
      `HTTP ${aprovar.status} / registro=${conf?.status} / nota=${statusNotaPosConf}`,
      aprovar.status < 300 && conf?.status === 'APROVADA' && statusNotaPosConf === 'AGUARDANDO_ATESTO',
    );

    const obtida = await req('GET', `/notas-fiscais/${notaId}/conferencia`, admin);
    const c = obtida.body?.data;
    registrar(
      'F',
      'F4 conferência persistida com checklist e ressalvas',
      'APROVADA + 2 itens + ressalva',
      `${c?.status} / ${c?.checklist?.length ?? 0} item(ns) / ressalva=${c?.ressalvas ? 'sim' : 'não'}`,
      obtida.status === 200 && Array.isArray(c?.checklist) && c.checklist.length === 2 && !!c?.ressalvas,
    );
  }

  // ── G. Atesto ───────────────────────────────────────────────────────────
  console.log('\n-- G. Atesto --');
  let liquidacaoId = '';
  {
    const excedente = await req('POST', `/notas-fiscais/${notaId}/atestos`, admin, { tipo: 'INTEGRAL', valorAtestado: '999.00' });
    registrar('G', 'G1 atesto acima do saldo é recusado', '409', String(excedente.status), excedente.status === 409);

    const parcial = await req('POST', `/notas-fiscais/${notaId}/atestos`, admin, { tipo: 'PARCIAL', valorAtestado: '5.00', justificativa: 'Atesto parcial E2E.' });
    registrar(
      'G',
      'G2 atesto parcial 5.00 aceito; nota segue aguardando atesto',
      '2xx + nota AGUARDANDO_ATESTO',
      `HTTP ${parcial.status} / ${parcial.body?.data?.nota?.status ?? parcial.body?.data?.notaStatus ?? '-'}`,
      parcial.status < 300,
    );

    const det = await req('GET', `/notas-fiscais/${notaId}`, admin);
    registrar(
      'G',
      'G3 após parcial: 1 atesto registrado e nota ainda AGUARDANDO_ATESTO',
      '1 atesto / AGUARDANDO_ATESTO',
      `${det.body?.data?.atestos?.length} atesto(s) / ${det.body?.data?.status}`,
      det.body?.data?.atestos?.length === 1 && det.body?.data?.status === 'AGUARDANDO_ATESTO',
    );

    const integral = await req('POST', `/notas-fiscais/${notaId}/atestos`, admin, { tipo: 'INTEGRAL', valorAtestado: '7.50' });
    registrar('G', 'G4 atesto integral do saldo restante (7.50) aceito', '2xx', String(integral.status), integral.status < 300);

    const det2 = await req('GET', `/notas-fiscais/${notaId}`, admin);
    registrar(
      'G',
      'G5 nota ATESTADA com 2 atestos (12.50 = valorTotal)',
      'ATESTADA / 2 atestos',
      `${det2.body?.data?.status} / ${det2.body?.data?.atestos?.length}`,
      det2.body?.data?.status === 'ATESTADA' && det2.body?.data?.atestos?.length === 2,
    );

    const extra = await req('POST', `/notas-fiscais/${notaId}/atestos`, admin, { tipo: 'INTEGRAL', valorAtestado: '1.00' });
    registrar('G', 'G6 novo atesto após ATESTADA é recusado', '400', String(extra.status), extra.status === 400);

    // Liquidação
    const liqExcesso = await req('POST', '/liquidacoes', admin, {
      notaFiscalId: notaId, numeroProcesso: 'SEI-0001/2026', valorLiquidado: '99.99',
    });
    registrar('G', 'G7 liquidação acima do atestado é recusada', '409', String(liqExcesso.status), liqExcesso.status === 409);

    const liqEscola = await req('POST', '/liquidacoes', escolaUser, {
      notaFiscalId: notaId, numeroProcesso: 'SEI-0002/2026', valorLiquidado: '12.50',
    });
    registrar('G', 'G8 ESCOLA não liquida (papel)', '403', String(liqEscola.status), liqEscola.status === 403);

    const liq = await req('POST', '/liquidacoes', admin, {
      notaFiscalId: notaId, numeroProcesso: 'SEI-0001/2026', valorLiquidado: '12.50', dataLiquidacao: '2026-10-11',
    });
    liquidacaoId = liq.body?.data?.id ?? '';
    registrar(
      'G',
      'G9 liquidação integral registrada (REGISTRADA)',
      '2xx + REGISTRADA + id',
      `HTTP ${liq.status} / ${liq.body?.data?.status} / ${liquidacaoId}`,
      liq.status < 300 && liq.body?.data?.status === 'REGISTRADA' && !!liquidacaoId,
    );

    const liqNova = await req('POST', '/liquidacoes', admin, {
      notaFiscalId: notaId, numeroProcesso: 'SEI-0003/2026', valorLiquidado: '1.00',
    });
    registrar('G', 'G10 segunda liquidação é recusada (saldo atestado esgotado)', '409', String(liqNova.status), liqNova.status === 409);
  }

  // ── H. Pagamentos, estorno e concorrência ───────────────────────────────
  console.log('\n-- H. Pagamentos --');
  let p1 = '', p2 = '';
  {
    const pagaExcesso = await req('POST', '/pagamentos', admin, { liquidacaoId, valorPago: '99.99', tipo: 'INTEGRAL' });
    registrar('H', 'H1 pagamento acima do saldo é recusado', '409', String(pagaExcesso.status), pagaExcesso.status === 409);

    const paga1 = await req('POST', '/pagamentos', admin, { liquidacaoId, valorPago: '6.00', tipo: 'PARCIAL', dataPagamento: '2026-10-11' });
    p1 = paga1.body?.data?.id ?? '';
    registrar(
      'H',
      'H2 pagamento parcial 6.00 registrado (status REGISTRADO)',
      '2xx + REGISTRADO',
      `HTTP ${paga1.status} / ${paga1.body?.data?.status}`,
      paga1.status < 300 && paga1.body?.data?.status === 'REGISTRADO' && !!p1,
    );

    const integralErrado = await req('POST', '/pagamentos', admin, { liquidacaoId, valorPago: '6.00', tipo: 'INTEGRAL' });
    registrar('H', 'H3 pagamento integral ≠ saldo é recusado', '400', String(integralErrado.status), integralErrado.status === 400);

    const paga2 = await req('POST', '/pagamentos', admin, { liquidacaoId, valorPago: '6.50', tipo: 'INTEGRAL', dataPagamento: '2026-10-11' });
    p2 = paga2.body?.data?.id ?? '';
    registrar(
      'H',
      'H4 pagamento integral do saldo (6.50) → CONFIRMADO',
      '2xx + CONFIRMADO',
      `HTTP ${paga2.status} / ${paga2.body?.data?.status}`,
      paga2.status < 300 && paga2.body?.data?.status === 'CONFIRMADO' && !!p2,
    );

    const estorno = await req('POST', `/pagamentos/${p2}/estornar`, admin, { motivo: 'Estorno de teste E2E SDD-005.' });
    registrar(
      'H',
      'H5 estorno marca ESTORNADO (sem exclusão do registro)',
      '2xx + ESTORNADO',
      `HTTP ${estorno.status} / ${estorno.body?.data?.status}`,
      estorno.status < 300 && estorno.body?.data?.status === 'ESTORNADO',
    );

    const estorno2 = await req('POST', `/pagamentos/${p2}/estornar`, admin, { motivo: 'Tentativa repetida.' });
    registrar('H', 'H6 estorno repetido é recusado', '409', String(estorno2.status), estorno2.status === 409);

    // Saldo restituído: 12.50 − 6.00 = 6.50. Dois pagamentos parciais de 4.00
    // em paralelo somam 8.00 > 6.50: exatamente um pode vencer (lock FOR UPDATE).
    const [c1, c2] = await Promise.all([
      req('POST', '/pagamentos', admin, { liquidacaoId, valorPago: '4.00', tipo: 'PARCIAL', dataPagamento: '2026-10-11' }),
      req('POST', '/pagamentos', admin, { liquidacaoId, valorPago: '4.00', tipo: 'PARCIAL', dataPagamento: '2026-10-11' }),
    ]);
    const sucessos = [c1, c2].filter((r) => r.status < 300).length;
    const conflitos = [c1, c2].filter((r) => r.status === 409).length;
    registrar(
      'H',
      'H7 concorrência: dois pagamentos parciais simultâneos → exatamente um vence e um conflita',
      '1 × 2xx e 1 × 409',
      `${sucessos} × 2xx e ${conflitos} × 409 (${c1.status}/${c2.status})`,
      sucessos === 1 && conflitos === 1,
    );
  }

  // ── I. Consistência financeira final e dashboard ────────────────────────
  console.log('\n-- I. Saldos e dashboard --');
  {
    const pagamentos = await req('GET', '/pagamentos', admin);
    const itens = pagamentos.body?.data?.items ?? [];
    const ativos = itens.filter((p: any) => ['REGISTRADO', 'CONFIRMADO', 'PARCIAL'].includes(p.status));
    const estornados = itens.filter((p: any) => p.status === 'ESTORNADO');
    const somaAtivos = ativos.reduce((s: number, p: any) => s + Number(p.valorPago), 0);
    registrar(
      'I',
      'I1 histórico de pagamentos: 3 registros (p1, p2 estornado, vencedor da concorrência) e Σ ativa = 10.00',
      '3 itens / 1 ESTORNADO / Σ ativos 10.00',
      `${itens.length} itens / ${estornados.length} estornado(s) / Σ ativos ${somaAtivos.toFixed(2)}`,
      itens.length === 3 && estornados.length === 1 && Math.abs(somaAtivos - 10) < 0.001,
    );

    const liquidacoes = await req('GET', '/liquidacoes', admin);
    const liqItens = liquidacoes.body?.data?.items ?? [];
    const somaLiq = liqItens.reduce((s: number, l: any) => s + Number(l.valorLiquidado), 0);
    registrar(
      'I',
      'I2 liquidação única de 12.50 e saldo pendente de pagamento = 2.50',
      '1 liq / Σ 12.50 / saldo 2.50',
      `${liqItens.length} liq / Σ ${somaLiq.toFixed(2)} / saldo ${(somaLiq - somaAtivosSafe(liqItens, itens)).toFixed(2)}`,
      liqItens.length === 1 && Math.abs(somaLiq - 12.5) < 0.001 && Math.abs(somaLiq - somaAtivosSafe(liqItens, itens) - 2.5) < 0.001,
    );

    const rotas = ['indicadores', 'saldos', 'pendencias', 'divergencias', 'grafico'];
    for (const rota of rotas) {
      const r = await req('GET', `/dashboard-financeiro/${rota}`, admin);
      registrar('I', `I3 dashboard ${rota} responde`, '200 + dados', `HTTP ${r.status} + ${r.body?.data ? 'dados' : 'sem dados'}`, r.status === 200 && !!r.body?.data);
    }

    const revogar = await req('DELETE', `/vinculos/${escolaVinculoId}`, admin);
    const escolaDepois = await req('GET', '/notas-fiscais', escolaUser);
    registrar(
      'I',
      'I4 vínculo revogado bloqueia imediatamente (ciclo de vida do vínculo)',
      'DELETE 2xx + escola 403',
      `DELETE ${revogar.status} / escola ${escolaDepois.status}`,
      revogar.status < 300 && escolaDepois.status === 403,
    );
  }

  // ── J. Operação 100% manual (sem sistemas externos) ─────────────────────
  console.log('\n-- J. Cadastro manual, correção e recebimentos --');
  {
    let notaManualId = '';
    let vinculoManualId = '';
    let liquidacaoManualId = '';

    const payloadManual = {
      contratoId: ctx.contratoId,
      fornecedorId: ctx.fornecedorId,
      numero: '90001',
      serie: '1',
      modelo: '55',
      chaveAcesso: chaveNfeUnica(),
      dataEmissao: '2026-10-06T00:00:00.000Z',
      cnpjEmitente: '12345678000195',
      documentoDestinatario: '12345678000195',
      valorProdutos: '100.00',
      valorTotal: '100.00',
      valorDesconto: '0.00',
      valorFrete: '0.00',
      valorOutrasDespesas: '0.00',
      itens: [
        {
          numeroItem: 1,
          descricao: 'Arroz',
          unidadeComercial: 'KG',
          quantidade: '10.0000',
          valorUnitario: '10.00',
          valorTotal: '100.00',
          contratoItemId: ctx.contratoItemId,
        },
      ],
      observacoes: 'Cadastro manual E2E — operação administrativa (sem consulta a sistemas externos).',
    };

    // J1 cadastro manual (sem XML, sem autorização externa).
    const criar = await req('POST', '/notas-fiscais', admin, payloadManual);
    notaManualId = criar.body?.data?.id ?? '';
    registrar(
      'J',
      'J1 cadastro manual cria a nota em PENDENTE_PROCESSAMENTO',
      '2xx + id + PENDENTE_PROCESSAMENTO',
      `HTTP ${criar.status} / ${criar.body?.data?.status ?? '-'}`,
      criar.status < 300 && !!notaManualId && criar.body?.data?.status === 'PENDENTE_PROCESSAMENTO',
    );

    // J2 correção de dados antes da confirmação.
    const corrigir = await req('PATCH', `/notas-fiscais/${notaManualId}`, admin, {
      numero: '90001-A',
      observacoes: 'Número corrigido antes da confirmação (E2E).',
    });
    registrar(
      'J',
      'J2 correção manual dos dados antes da confirmação',
      '2xx + número atualizado',
      `HTTP ${corrigir.status} / ${corrigir.body?.data?.numero ?? '-'}`,
      corrigir.status < 300 && corrigir.body?.data?.numero === '90001-A',
    );

    // J3 transição de status pela máquina de estados.
    const confirmar = await req('PATCH', `/notas-fiscais/${notaManualId}`, admin, {
      status: 'PROCESSADA',
      motivo: 'Dados manuais conferidos (E2E).',
    });
    registrar(
      'J',
      'J3 transição para PROCESSADA via PATCH (máquina de estados)',
      '2xx + PROCESSADA',
      `HTTP ${confirmar.status} / ${confirmar.body?.data?.status ?? '-'}`,
      confirmar.status < 300 && confirmar.body?.data?.status === 'PROCESSADA',
    );

    // J4 papel: EXTENSIONISTA não cadastra nota fiscal manual.
    const extCriar = await req('POST', '/notas-fiscais', extUser, payloadManual);
    registrar('J', 'J4 EXTENSIONISTA não cadastra nota fiscal manual (papel)', '403', String(extCriar.status), extCriar.status === 403);

    // J5 escopo: DRE-B não cadastra nota fiscal em contrato fora do seu escopo.
    const dreBCriar = await req('POST', '/notas-fiscais', dreBUser, payloadManual);
    registrar('J', 'J5 DRE-B fora do escopo não cadastra nota fiscal manual', '403', String(dreBCriar.status), dreBCriar.status === 403);

    // J6 candidatos de recebimento (entregas aceitas do contrato/fornecedor).
    const candidatos = await req('GET', `/notas-fiscais/${notaManualId}/recebimentos/candidatos`, admin);
    const cand = candidatos.body?.data;
    const itemManual = cand?.itens?.[0];
    const recebManual = cand?.recebimentos?.[0];
    registrar(
      'J',
      'J6 candidatos de recebimento listam entrega aceita com disponibilidade',
      '200 + ≥1 candidato + disponibilidade > 0',
      `HTTP ${candidatos.status} / candidatos=${cand?.recebimentos?.length ?? 0} / disp=${recebManual?.quantidadeDisponivel ?? '-'}`,
      candidatos.status === 200 && (cand?.recebimentos?.length ?? 0) >= 1 && Number(recebManual?.quantidadeDisponivel) > 0,
    );

    // J7 vínculo manual do recebimento ao item da nota.
    const vincular = await req('POST', `/notas-fiscais/${notaManualId}/recebimentos`, admin, {
      notaFiscalItemId: itemManual?.id,
      entregaId: recebManual?.entregaId,
      entregaItemId: recebManual?.entregaItemId,
      quantidadeVinculada: '10.0000',
      observacoes: 'Recebimento conferido fisicamente (E2E).',
    });
    vinculoManualId = vincular.body?.data?.vinculos?.[0]?.id ?? '';
    registrar(
      'J',
      'J7 recebimento aceito vinculado ao item da nota (1 vínculo)',
      '2xx + 1 vínculo com quantidades',
      `HTTP ${vincular.status} / vínculos=${vincular.body?.data?.vinculos?.length ?? 0}`,
      vincular.status < 300 && (vincular.body?.data?.vinculos?.length ?? 0) === 1 && !!vinculoManualId,
    );

    // J8 guarda de concorrência: vincular acima da faturada é recusado.
    const excede = await req('POST', `/notas-fiscais/${notaManualId}/recebimentos`, admin, {
      notaFiscalItemId: itemManual?.id,
      entregaId: recebManual?.entregaId,
      entregaItemId: recebManual?.entregaItemId,
      quantidadeVinculada: '1.0000',
    });
    registrar('J', 'J8 vínculo acima da quantidade faturada é recusado', '409', String(excede.status), excede.status === 409);

    // J9 conciliação manual sem divergências.
    const conciliarManual = await req('POST', `/notas-fiscais/${notaManualId}/conciliar`, admin);
    const detManual = await req('GET', `/notas-fiscais/${notaManualId}`, admin);
    const divsManual = detManual.body?.data?.conciliacao?.divergencias ?? [];
    registrar(
      'J',
      'J9 conciliação manual converge: CONCILIADA com 0 divergências',
      '2xx / PENDENTE_CONFERENCIA / CONCILIADA / 0 divergências',
      `HTTP ${conciliarManual.status} / ${detManual.body?.data?.status} / ${detManual.body?.data?.resultadoConciliacao} / ${divsManual.length} div`,
      conciliarManual.status < 300 &&
        detManual.body?.data?.status === 'PENDENTE_CONFERENCIA' &&
        detManual.body?.data?.resultadoConciliacao === 'CONCILIADA' &&
        divsManual.length === 0,
    );

    // J10 conferência + atesto manual até ATESTADA.
    const confManual = await req('POST', `/notas-fiscais/${notaManualId}/conferencia`, admin, { acao: 'APROVAR' });
    const atestoManual = await req('POST', `/notas-fiscais/${notaManualId}/atestos`, admin, {
      tipo: 'INTEGRAL',
      valorAtestado: '100.00',
      justificativa: 'Nota manual conferida e atestada (E2E).',
    });
    const detAtestada = await req('GET', `/notas-fiscais/${notaManualId}`, admin);
    registrar(
      'J',
      'J10 conferência aprovada e atesto integral movem a nota para ATESTADA',
      '2xx / 2xx / ATESTADA',
      `conf=${confManual.status} / atesto=${atestoManual.status} / nota=${detAtestada.body?.data?.status ?? '-'}`,
      confManual.status < 300 && atestoManual.status < 300 && detAtestada.body?.data?.status === 'ATESTADA',
    );

    // J11 bloqueio pós-atesto: desvincular recebimento é recusado.
    const desvincular = await req('DELETE', `/notas-fiscais/${notaManualId}/recebimentos/${vinculoManualId}`, admin);
    registrar(
      'J',
      'J11 desvinculação de recebimento bloqueada após o atesto',
      '400',
      String(desvincular.status),
      desvincular.status === 400,
    );

    // J12 liquidação manual com número da liquidação e observações.
    const liqManual = await req('POST', '/liquidacoes', admin, {
      notaFiscalId: notaManualId,
      numeroProcesso: 'SEI-90001/2026',
      numeroLiquidacao: 'LQ-2026-900',
      valorLiquidado: '100.00',
      dataLiquidacao: '2026-10-11',
      observacoes: 'Liquidação registrada manualmente (E2E).',
    });
    liquidacaoManualId = liqManual.body?.data?.id ?? '';
    registrar(
      'J',
      'J12 liquidação manual registra número da liquidação e observações',
      '2xx + numeroLiquidacao + observacoes',
      `HTTP ${liqManual.status} / ${liqManual.body?.data?.numeroLiquidacao ?? '-'}`,
      liqManual.status < 300 &&
        !!liquidacaoManualId &&
        liqManual.body?.data?.numeroLiquidacao === 'LQ-2026-900' &&
        !!liqManual.body?.data?.observacoes,
    );

    // J13 pagamento manual parcial com referência e observações.
    const pagManual = await req('POST', '/pagamentos', admin, {
      liquidacaoId: liquidacaoManualId,
      valorPago: '40.00',
      tipo: 'PARCIAL',
      dataPagamento: '2026-10-11',
      numeroOrdemPagamento: 'OP-2026-900',
      observacoes: 'Pagamento parcial manual (E2E).',
    });
    registrar(
      'J',
      'J13 pagamento manual registra referência e observações (parcial)',
      '2xx + numeroOrdemPagamento + observacoes + PARCIAL',
      `HTTP ${pagManual.status} / ${pagManual.body?.data?.numeroOrdemPagamento ?? '-'}`,
      pagManual.status < 300 &&
        pagManual.body?.data?.numeroOrdemPagamento === 'OP-2026-900' &&
        !!pagManual.body?.data?.observacoes &&
        pagManual.body?.data?.tipo === 'PARCIAL',
    );
  }

  // ── Resumo ──────────────────────────────────────────────────────────────
  const total = resultados.length;
  const ok = resultados.filter((r) => r.ok).length;
  const falhas = resultados.filter((r) => !r.ok);
  console.log(`\n=== RESUMO E2E SDD-005: ${ok}/${total} asserções OK ===`);
  for (const f of falhas) console.log(`  FALHA: [${f.grupo}] ${f.caso} — esperado ${f.esperado}, obtido ${f.obtido}`);
  process.exit(falhas.length === 0 ? 0 : 1);
}

function somaAtivosSafe(_liqs: any[], pagamentos: any[]): number {
  return pagamentos
    .filter((p) => ['REGISTRADO', 'CONFIRMADO', 'PARCIAL'].includes(p.status))
    .reduce((s, p) => s + Number(p.valorPago), 0);
}

principal().catch((e) => {
  console.error('\n[ERRO FATAL E2E]', e);
  process.exit(1);
});
