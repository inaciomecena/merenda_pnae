// SDD-005 — ETAPA 5: homologação funcional completa no banco de DESENVOLVIMENTO
// Parte A: dados fictícios consistentes (edital → proposta → contrato → recebimento),
//          criados sem alterar nenhum registro existente.
// Parte B: fluxo fiscal completo via API (cadastro manual → conciliação → conferência →
//          atesto → liquidação → pagamentos parcial/complementar → saldos → dashboard → auditoria).
// Parte C: cenários 7 e 9 da Etapa 4 (isolamento DRE×DRE e fornecedor×fornecedor).
const { PrismaClient } = require('@prisma/client');
const BASE = process.env.BASE ?? 'http://localhost:3200/api/v1';
const prisma = new PrismaClient();

let passos = 0;
let falhas = 0;
function registrar(caso, esperado, obtido, ok) {
  passos += 1;
  if (!ok) falhas += 1;
  console.log(`  ${ok ? '[OK]   ' : '[FALHA]'} ${caso} — esperado: ${esperado} | obtido: ${obtido}`);
}

async function req(metodo, rota, token, json) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (json !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(`${BASE}${rota}`, { method: metodo, headers, body: json !== undefined ? JSON.stringify(json) : undefined });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

async function login(email) {
  const r = await req('POST', '/auth/login', undefined, { email, password: 'Admin@123' });
  const token = r.body?.data?.accessToken;
  if (!token) throw new Error(`Login falhou para ${email}: HTTP ${r.status} ${JSON.stringify(r.body)}`);
  return token;
}

function chaveNfe() {
  let s = '5126';
  for (let i = 0; i < 40; i += 1) s += Math.floor(Math.random() * 10);
  return s;
}

(async () => {
  console.log('\n== ETAPA 5 — HOMOLOGAÇÃO SDD-005 NO BANCO DE DESENVOLVIMENTO ==\n');

  // ── Parte A: dados fictícios consistentes (sem tocar em registros existentes) ──
  console.log('— Parte A: cadeia fictícia edital → proposta → contrato → recebimento —');
  const municipio = await prisma.municipio.findFirst({ where: { nome: 'Cuiabá' } });
  const dreA = await prisma.dRE.findFirst({ where: { codigo: 'CBA' } });
  const escola = await prisma.escola.findFirst({ where: { municipioId: municipio.id } });
  const fornecedor = await prisma.produtor.findFirst({ where: { nome: 'Joao da Silva' } });

  let edital = await prisma.edital.findFirst({ where: { numero: '9901/2026', ano: 2026 } });
  if (!edital) {
    edital = await prisma.edital.create({ data: { numero: '9901/2026', ano: 2026, titulo: 'Chamada pública fictícia — ativação SDD-005', status: 'ATIVO', municipioId: municipio.id, createdBy: 'ativacao-sdd005', updatedBy: 'ativacao-sdd005' } });
  }
  let proposta = await prisma.proposta.findFirst({ where: { editalId: edital.id, produtorId: fornecedor.id } });
  if (!proposta) {
    proposta = await prisma.proposta.create({ data: { editalId: edital.id, produtorId: fornecedor.id, status: 'FINALIZADA', valorTotal: 1400, createdBy: 'ativacao-sdd005', updatedBy: 'ativacao-sdd005' } });
  }
  const dadosItens = [
    { produto: 'Arroz', unidade: 'KG', qtd: 100, preco: 10, total: 1000, qtdAceita: 10 },
    { produto: 'Feijão', unidade: 'KG', qtd: 50, preco: 8, total: 400, qtdAceita: 5 },
  ];
  for (const it of dadosItens) {
    if (!(await prisma.propostaItem.findFirst({ where: { propostaId: proposta.id, produto: it.produto } }))) {
      await prisma.propostaItem.create({ data: { propostaId: proposta.id, produto: it.produto, unidade: it.unidade, quantidade: it.qtd, precoUnitario: it.preco, valorTotal: it.total, createdBy: 'ativacao-sdd005', updatedBy: 'ativacao-sdd005' } });
    }
  }
  let contrato = await prisma.contrato.findFirst({ where: { numero: '90001/2026', exercicio: 2026 } });
  if (!contrato) {
    contrato = await prisma.contrato.create({ data: { numero: '90001/2026', exercicio: 2026, editalId: edital.id, propostaId: proposta.id, produtorId: fornecedor.id, dreId: dreA.id, escolaId: escola.id, municipioId: municipio.id, valorInicial: 1400, valorAtualizado: 1400, status: 'VIGENTE', objeto: 'Fornecimento de gêneros alimentícios (contrato fictício — ativação SDD-005)', vigenciaInicio: new Date('2026-01-01'), vigenciaFim: new Date('2026-12-31'), createdBy: 'ativacao-sdd005', updatedBy: 'ativacao-sdd005' } });
  }
  const contratoItens = {};
  for (const it of dadosItens) {
    let ci = await prisma.contratoItem.findFirst({ where: { contratoId: contrato.id, produto: it.produto } });
    if (!ci) {
      const pi = await prisma.propostaItem.findFirst({ where: { propostaId: proposta.id, produto: it.produto } });
      ci = await prisma.contratoItem.create({ data: { contratoId: contrato.id, propostaItemId: pi.id, produto: it.produto, unidade: it.unidade, quantidadeContratada: it.qtd, quantidadeDisponivel: it.qtd, valorUnitario: it.preco, valorTotal: it.total, createdBy: 'ativacao-sdd005', updatedBy: 'ativacao-sdd005' } });
    }
    contratoItens[it.produto] = ci.id;
  }
  let programacao = await prisma.programacaoEntrega.findFirst({ where: { contratoId: contrato.id, numero: 'PE-SDD005-ATIV-001' } });
  if (!programacao) {
    programacao = await prisma.programacaoEntrega.create({ data: { numero: 'PE-SDD005-ATIV-001', contratoId: contrato.id, fornecedorId: fornecedor.id, unidadeEscolarId: escola.id, dreId: dreA.id, municipioId: municipio.id, dataPrevista: new Date('2026-10-08'), status: 'CONFIRMADA', createdBy: 'ativacao-sdd005', updatedBy: 'ativacao-sdd005' } });
    for (const it of dadosItens) {
      await prisma.programacaoEntregaItem.create({ data: { programacaoId: programacao.id, contratoItemId: contratoItens[it.produto], produto: it.produto, unidadeMedida: it.unidade, quantidadeProgramada: it.qtdAceita, valorUnitarioContratual: it.preco, valorTotalPrevisto: it.qtdAceita * it.preco, createdBy: 'ativacao-sdd005', updatedBy: 'ativacao-sdd005' } });
    }
  }
  let entrega = await prisma.entrega.findFirst({ where: { programacaoId: programacao.id } });
  const entregaItens = {};
  if (!entrega) {
    entrega = await prisma.entrega.create({ data: { numero: 'ENT-SDD005-ATIV-001', programacaoId: programacao.id, fornecedorId: fornecedor.id, unidadeEscolarId: escola.id, dreId: dreA.id, municipioId: municipio.id, dataEntrega: new Date('2026-10-09'), status: 'ACEITA', aceitaEm: new Date('2026-10-09'), aceitaPor: 'ativacao-sdd005', createdBy: 'ativacao-sdd005', updatedBy: 'ativacao-sdd005' } });
    for (const it of dadosItens) {
      const pei = await prisma.programacaoEntregaItem.findFirst({ where: { programacaoId: programacao.id, produto: it.produto } });
      const ei = await prisma.entregaItem.create({ data: { entregaId: entrega.id, programacaoItemId: pei.id, quantidadeInformada: it.qtdAceita, quantidadeAceita: it.qtdAceita, quantidadeRejeitada: 0, createdBy: 'ativacao-sdd005', updatedBy: 'ativacao-sdd005' } });
      entregaItens[it.produto] = ei.id;
    }
  } else {
    for (const it of dadosItens) {
      const pei = await prisma.programacaoEntregaItem.findFirst({ where: { programacaoId: programacao.id, produto: it.produto } });
      const ei = await prisma.entregaItem.findFirst({ where: { entregaId: entrega.id, programacaoItemId: pei.id } });
      entregaItens[it.produto] = ei.id;
    }
  }
  console.log(`Cadeia fictícia: edital ${edital.numero} → contrato ${contrato.numero} (DRE Metropolitana, fornecedor ${fornecedor.nome}) → entrega ${entrega.numero} ACEITA (Arroz 10 KG + Feijão 5 KG)`);

  // ── Parte B: fluxo fiscal completo via API ──
  console.log('\n— Parte B: fluxo fiscal completo via API (operador: DRE-A) —');
  const admin = await login('admin@seaf.gov.br');
  const dreAUser = await login('dre@seaf.gov.br');

  // 1) cadastro manual da nota fiscal
  const payloadManual = {
    contratoId: contrato.id,
    fornecedorId: fornecedor.id,
    numero: '90001',
    serie: '1',
    modelo: '55',
    chaveAcesso: chaveNfe(),
    dataEmissao: '2026-10-10T00:00:00.000Z',
    cnpjEmitente: fornecedor.cpfCnpj,
    documentoDestinatario: '12345678000195',
    valorProdutos: '140.00',
    valorTotal: '140.00',
    valorDesconto: '0.00',
    valorFrete: '0.00',
    valorOutrasDespesas: '0.00',
    itens: [
      { numeroItem: 1, descricao: 'Arroz', unidadeComercial: 'KG', quantidade: '10.0000', valorUnitario: '10.00', valorTotal: '100.00', contratoItemId: contratoItens['Arroz'] },
      { numeroItem: 2, descricao: 'Feijão', unidadeComercial: 'KG', quantidade: '5.0000', valorUnitario: '8.00', valorTotal: '40.00', contratoItemId: contratoItens['Feijão'] },
    ],
    observacoes: 'Cadastro manual — ativação SDD-005 (operação administrativa; sem consulta a sistemas externos).',
  };
  const criar = await req('POST', '/notas-fiscais', dreAUser, payloadManual);
  const notaId = criar.body?.data?.id ?? '';
  registrar('1) Cadastro manual da nota fiscal (DRE-A)', '2xx + PENDENTE_PROCESSAMENTO', `HTTP ${criar.status} / ${criar.body?.data?.status ?? '-'}`, criar.status < 300 && !!notaId && criar.body?.data?.status === 'PENDENTE_PROCESSAMENTO');

  // 2) correção dos dados antes da confirmação
  const corrigir = await req('PATCH', `/notas-fiscais/${notaId}`, dreAUser, { numero: '90001-ATIV', observacoes: 'Número conferido com o documento físico antes da confirmação (ativação).' });
  registrar('2) Correção manual dos dados antes da confirmação', '2xx + número atualizado', `HTTP ${corrigir.status} / ${corrigir.body?.data?.numero ?? '-'}`, corrigir.status < 300 && corrigir.body?.data?.numero === '90001-ATIV');

  // 3) confirmação via máquina de estados
  const confirmar = await req('PATCH', `/notas-fiscais/${notaId}`, dreAUser, { status: 'PROCESSADA', motivo: 'Dados manuais conferidos com o documento fiscal (ativação).' });
  registrar('3) Confirmação dos dados (transição PROCESSADA)', '2xx + PROCESSADA', `HTTP ${confirmar.status} / ${confirmar.body?.data?.status ?? '-'}`, confirmar.status < 300 && confirmar.body?.data?.status === 'PROCESSADA');

  // 4) candidatos de recebimento
  const candidatos = await req('GET', `/notas-fiscais/${notaId}/recebimentos/candidatos`, dreAUser);
  const cand = candidatos.body?.data ?? {};
  const itemDe = (desc) => (cand.itens ?? []).find((i) => String(i.descricao).startsWith(desc));
  const recebDe = (desc) => (cand.recebimentos ?? []).find((r) => String(r.produto ?? r.descricao ?? '').startsWith(desc));
  const itemArroz = itemDe('Arroz'); const itemFeijao = itemDe('Feijão');
  const recebArroz = recebDe('Arroz'); const recebFeijao = recebDe('Feijão');
  registrar('4) Candidatos de recebimento listam itens e entregas aceitas', '2xx + 2 itens + 2 recebimentos', `HTTP ${candidatos.status} / itens=${(cand.itens ?? []).length} / recebimentos=${(cand.recebimentos ?? []).length}`, candidatos.status === 200 && (cand.itens ?? []).length === 2 && (cand.recebimentos ?? []).length >= 2);

  // 5) vínculo dos recebimentos aos itens
  const vinc1 = await req('POST', `/notas-fiscais/${notaId}/recebimentos`, dreAUser, { notaFiscalItemId: itemArroz?.id, entregaId: recebArroz?.entregaId, entregaItemId: recebArroz?.entregaItemId, quantidadeVinculada: '10.0000', observacoes: 'Recebimento de Arroz conferido fisicamente (ativação).' });
  const vinc2 = await req('POST', `/notas-fiscais/${notaId}/recebimentos`, dreAUser, { notaFiscalItemId: itemFeijao?.id, entregaId: recebFeijao?.entregaId, entregaItemId: recebFeijao?.entregaItemId, quantidadeVinculada: '5.0000', observacoes: 'Recebimento de Feijão conferido fisicamente (ativação).' });
  const totalVinculos = (vinc1.body?.data?.vinculos?.length ?? 0) + (vinc2.body?.data?.vinculos?.length ?? 0);
  registrar('5) Vínculo manual de recebimentos aos itens (2 vínculos)', '2xx + 2 vínculos', `HTTP ${vinc1.status}/${vinc2.status} / vínculos=${totalVinculos}`, vinc1.status < 300 && vinc2.status < 300 && totalVinculos === 2);

  // 6) conciliação
  const conciliar = await req('POST', `/notas-fiscais/${notaId}/conciliar`, dreAUser);
  const detConc = await req('GET', `/notas-fiscais/${notaId}`, dreAUser);
  const divs = detConc.body?.data?.conciliacao?.divergencias ?? [];
  registrar('6) Conciliação (quantitativa recebido × faturado)', '2xx / PENDENTE_CONFERENCIA / CONCILIADA / 0 divergências', `HTTP ${conciliar.status} / ${detConc.body?.data?.status} / ${detConc.body?.data?.resultadoConciliacao} / ${divs.length} div`, conciliar.status < 300 && detConc.body?.data?.status === 'PENDENTE_CONFERENCIA' && detConc.body?.data?.resultadoConciliacao === 'CONCILIADA' && divs.length === 0);

  // 7) conferência documental
  const conferencia = await req('POST', `/notas-fiscais/${notaId}/conferencia`, dreAUser, {
    acao: 'APROVAR',
    checklist: [
      { item: 'Documento fiscal legível e legítimo (dados conferidos manualmente)', conforme: true },
      { item: 'Produtos e quantidades conferidos com o recebimento físico', conforme: true },
      { item: 'Preços conferidos com o contrato vigente', conforme: true },
    ],
    justificativa: 'Conferência documental realizada presencialmente com o documento físico (ativação SDD-005).',
  });
  registrar('7) Conferência documental aprovada', '2xx', `HTTP ${conferencia.status}`, conferencia.status < 300);

  // 8) atesto
  const atesto = await req('POST', `/notas-fiscais/${notaId}/atestos`, dreAUser, { tipo: 'INTEGRAL', valorAtestado: '140.00', dataAtesto: '2026-10-12', justificativa: 'Nota atestada após conferência documental (ativação SDD-005).' });
  const detAtestada = await req('GET', `/notas-fiscais/${notaId}`, dreAUser);
  registrar('8) Atesto integral (manual, com segregação de papéis)', '2xx + ATESTADA', `HTTP ${atesto.status} / nota=${detAtestada.body?.data?.status ?? '-'}`, atesto.status < 300 && detAtestada.body?.data?.status === 'ATESTADA');

  // 9) liquidação administrativa
  const liq = await req('POST', '/liquidacoes', admin, { notaFiscalId: notaId, numeroProcesso: 'SEI-90001/2026', numeroLiquidacao: 'LQ-2026-ATIV-001', valorLiquidado: '140.00', dataLiquidacao: '2026-10-12', observacoes: 'Liquidação administrativa registrada manualmente (ativação SDD-005).' });
  const liquidacaoId = liq.body?.data?.id ?? '';
  registrar('9) Liquidação administrativa (processo + número + observações)', '2xx + numeroLiquidacao', `HTTP ${liq.status} / ${liq.body?.data?.numeroLiquidacao ?? '-'}`, liq.status < 300 && !!liquidacaoId && liq.body?.data?.numeroLiquidacao === 'LQ-2026-ATIV-001');

  // 10) pagamento parcial
  const pag1 = await req('POST', '/pagamentos', admin, { liquidacaoId, valorPago: '80.00', tipo: 'PARCIAL', dataPagamento: '2026-10-12', numeroOrdemPagamento: 'OP-MANUAL-001', observacoes: 'Primeira parcela (referência manual de banco — sem integração).' });
  registrar('10) Pagamento parcial (referência manual)', '2xx', `HTTP ${pag1.status}`, pag1.status < 300 && !!((pag1.body?.data?.id ?? pag1.body?.data?.pagamento?.id)));

  // 11) pagamento complementar (quita)
  const pag2 = await req('POST', '/pagamentos', admin, { liquidacaoId, valorPago: '60.00', tipo: 'INTEGRAL', dataPagamento: '2026-10-12', numeroOrdemPagamento: 'OP-MANUAL-002', observacoes: 'Parcela complementar que quita a liquidação (ativação SDD-005).' });
  registrar('11) Pagamento complementar (quitação)', '2xx', `HTTP ${pag2.status}`, pag2.status < 300 && !!((pag2.body?.data?.id ?? pag2.body?.data?.pagamento?.id)));

  // 12) guarda: pagamento acima do saldo liquidado
  const excede = await req('POST', '/pagamentos', admin, { liquidacaoId, valorPago: '0.01', tipo: 'PARCIAL' });
  registrar('12) Pagamento acima do saldo liquidado é bloqueado', '4xx (conflito)', `HTTP ${excede.status}`, excede.status >= 400 && excede.status < 500);

  // 13) saldos: soma dos pagamentos ativos = valor liquidado (liquidação quitada)
  const pags = await req('GET', `/pagamentos?liquidacaoId=${liquidacaoId}`, admin);
  const listaPags = pags.body?.data?.items ?? [];
  const somaPaga = listaPags.filter((p) => p.status !== 'ESTORNADO' && p.status !== 'CANCELADO').reduce((acc, p) => acc + Number(p.valorPago), 0);
  const liqs = await req('GET', `/liquidacoes?notaFiscalId=${notaId}`, admin);
  const liqDet = (liqs.body?.data?.items ?? [])[0] ?? {};
  registrar('13) Saldos: pagamentos ativos somam exatamente o valor liquidado', 'soma paga = 140.00 / liquidação registrada', `soma=${somaPaga.toFixed(2)} / liq.status=${liqDet.status ?? '-'}`, Math.abs(somaPaga - 140) < 0.001 && !!liqDet.id);

  // 14) dashboard financeiro
  const saldos = await req('GET', '/dashboard-financeiro/saldos', admin);
  const indicadores = await req('GET', '/dashboard-financeiro/indicadores', admin);
  const grafico = await req('GET', '/dashboard-financeiro/grafico', admin);
  registrar('14) Dashboard financeiro (saldos, indicadores e gráfico)', '200/200/200', `${saldos.status}/${indicadores.status}/${grafico.status}`, saldos.status === 200 && indicadores.status === 200 && grafico.status === 200);

  // 15) auditoria
  const auditApi = await req('GET', '/audit?limit=10', admin);
  const auditFiscal = await prisma.auditLog.findMany({
    where: { OR: [{ entity: 'NotaFiscal' }, { entity: 'Atesto' }, { entity: 'Liquidacao' }, { entity: 'Pagamento' }, { entity: { in: ['ConferenciaFiscal', 'VinculoRecebimentoFiscal', 'DivergenciaFiscal'] } }, { action: 'BOOTSTRAP_ADMIN_VINCULO' }] },
    select: { action: true, entity: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const resumoAud = {};
  for (const a of auditFiscal) { const k = `${a.action}:${a.entity}`; resumoAud[k] = (resumoAud[k] ?? 0) + 1; }
  console.log('      Auditoria fiscal (ação:entidade → qtd): ' + JSON.stringify(resumoAud));
  registrar('15) Auditoria registra o ciclo completo', 'API 200 + eventos de criação/atesto/liquidação/pagamento', `API ${auditApi.status} + ${auditFiscal.length} eventos`, auditApi.status === 200 && auditFiscal.length >= 8);

  // ── Parte C: cenários 7 e 9 da Etapa 4 ──
  console.log('\n— Parte C: isolamento institucional com dados reais (cenários 7 e 9) —');
  const dreBUser = await login('dre-b@seaf.gov.br');
  const produtorUser = await login('produtor-teste@seaf.gov.br');
  const listaDreB = await req('GET', '/notas-fiscais', dreBUser);
  const listaDreBIds = (listaDreB.body?.data?.items ?? []).map((n) => n.id);
  const detDreB = await req('GET', `/notas-fiscais/${notaId}`, dreBUser);
  registrar('7) DRE-B (outra DRE) não acessa documento da DRE-A', 'nota fora da lista + 403/404 no detalhe', `fora da lista=${!listaDreBIds.includes(notaId)} / detalhe=${detDreB.status}`, !listaDreBIds.includes(notaId) && (detDreB.status === 403 || detDreB.status === 404));
  const listaProd = await req('GET', '/notas-fiscais', produtorUser);
  const listaProdIds = (listaProd.body?.data?.items ?? []).map((n) => n.id);
  const detProd = await req('GET', `/notas-fiscais/${notaId}`, produtorUser);
  registrar('9) Fornecedor (produtor) não acessa documento de outro fornecedor', 'nota fora da lista + 403/404 no detalhe', `fora da lista=${!listaProdIds.includes(notaId)} / detalhe=${detProd.status}`, !listaProdIds.includes(notaId) && (detProd.status === 403 || detProd.status === 404));

  // ── resumo ──
  console.log(`\nETAPA 5: ${passos - falhas}/${passos} verificações OK`);
  const fs = require('fs');
  fs.writeFileSync('C:\\Users\\HP ELITE\\AppData\\Local\\Temp\\opencode\\backup-sdd005\\homologacao-ids.json', JSON.stringify({ notaId, liquidacaoId, contratoId: contrato.id, entregaId: entrega.id, editalId: edital.id }, null, 2));
  await prisma.$disconnect();
  process.exit(falhas === 0 ? 0 : 1);
})().catch(async (e) => { console.error('ERRO:', e.message.slice(0, 500)); await prisma.$disconnect(); process.exit(1); });
