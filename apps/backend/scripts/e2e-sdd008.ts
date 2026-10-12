/**
 * SDD-008 - homologacao integrada contra API HTTP e persistencia Prisma/MySQL.
 *
 * O runner nao remove dados: cada execucao usa numero/identificacao unicos e
 * deve ser apontada para um banco isolado (E2E_BASE). O JSON de evidencias e
 * gravado em e2e-sdd008-last-run.json.
 */
import { writeFile } from 'node:fs/promises';

const BASE = process.env.E2E_BASE ?? 'http://localhost:3208/api/v1';
const PASSWORD = process.env.E2E_PASSWORD ?? 'Admin@123';
const results: Array<{ caso: string; ok: boolean; esperado: string; obtido: unknown }> = [];
const context: Record<string, unknown> = { base: BASE };

function payload(value: any): any { return value?.data ?? value; }
function check(caso: string, ok: boolean, esperado: string, obtido: unknown) {
  results.push({ caso, ok, esperado, obtido });
  console.log(`${ok ? '[OK]    ' : '[FALHA] '} ${caso} | esperado=${esperado} | obtido=${typeof obtido === 'string' ? obtido : JSON.stringify(obtido)}`);
}

async function req(method: string, route: string, token?: string, body?: unknown) {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(`${BASE}${route}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const type = response.headers.get('content-type') ?? '';
  const data = type.includes('json') ? await response.json() : Buffer.from(await response.arrayBuffer());
  return { status: response.status, headers: response.headers, data };
}

function multipart(fields: Record<string, string>, file: { field: string; name: string; type: string; data: Buffer }) {
  const boundary = `----sdd008${Date.now()}${Math.floor(Math.random() * 100000)}`;
  const chunks: Buffer[] = [];
  for (const [key, value] of Object.entries(fields)) chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
  chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`));
  chunks.push(file.data, Buffer.from(`\r\n--${boundary}--\r\n`));
  return { contentType: `multipart/form-data; boundary=${boundary}`, body: Buffer.concat(chunks) };
}

async function login(email: string) {
  const r = await req('POST', '/auth/login', undefined, { email, password: PASSWORD });
  const token = payload(r.data)?.accessToken;
  check(`login ${email}`, r.status === 201 && !!token, '201 + accessToken', r.status);
  return token as string;
}

async function main() {
  const run = Date.now();
  const admin = await login('admin@seaf.gov.br');
  const extensionista = await login('extensionista@seaf.gov.br');
  const invalid = await req('GET', '/editais', 'token-expirado-invalido');
  check('JWT invalido bloqueado', invalid.status === 401, '401', invalid.status);

  const editaisResponse = await req('GET', '/editais?limit=100', admin);
  const editais = payload(editaisResponse.data)?.items ?? payload(editaisResponse.data) ?? [];
  let edital: any;
  let item: any;
  for (const candidate of editais) {
    const detail = await req('GET', `/editais/${candidate.id}`, admin);
    const d = payload(detail.data);
    if ((d?.itens ?? []).length) { edital = d; item = d.itens[0]; break; }
  }
  const produtoresResponse = await req('GET', '/produtores?limit=100', admin);
  const produtores = (payload(produtoresResponse.data)?.items ?? payload(produtoresResponse.data) ?? []).slice(0, 3);
  const dresResponse = await req('GET', '/dres', admin);
  const dres = payload(dresResponse.data) ?? [];
  const escolasResponse = await req('GET', '/escolas?limit=100', admin);
  const escolas = payload(escolasResponse.data)?.items ?? payload(escolasResponse.data) ?? [];
  const dre = dres.find((d: any) => d.codigo === 'DRE-SDD008') ?? dres[0];
  // A API de DRE expõe municipioSede como texto; o vinculo escola/DRE e a
  // fonte de verdade para o escopo, portanto selecionamos duas escolas ativas
  // e garantimos o vinculo logo abaixo.
  const escolasDre = (escolas.filter((e: any) => ['51001021', '51001022'].includes(e.codigo))
    .concat(escolas.filter((e: any) => e.active !== false))).filter((e: any, i: number, all: any[]) => all.findIndex((x) => x.id === e.id) === i).slice(0, 2);
  check('fontes institucionais e edital com item', editaisResponse.status === 200 && produtores.length >= 3 && !!edital?.id && !!item?.id && !!dre?.id && escolasDre.length >= 2, 'edital/item + 3 produtores + DRE + 2 escolas', `${produtores.length}/${!!edital?.id}/${!!item?.id}/${!!dre?.id}/${escolasDre.length}`);
  if (!edital?.id || !item?.id || produtores.length < 3 || !dre?.id || escolasDre.length < 2) throw new Error('Dados-base insuficientes para o E2E SDD-008.');
  const municipioId = escolasDre[0].municipioId;

  // Garante o vinculo institucional somente quando ausente; a operacao e aditiva.
  for (const escola of escolasDre) {
    const link = await req('POST', `/escolas/${escola.id}/vincular-dre`, admin, { dreId: dre.id, vigenciaInicio: '2026-01-01' });
    check(`vinculo escola/DRE ${escola.id}`, link.status < 300 || link.status === 409, '2xx ou 409 se ja existente', link.status);
  }

  const inicio = new Date(Date.now() - 86400000).toISOString();
  const fim = new Date(Date.now() + 86400000).toISOString();
  const numeroChamada = `SDD008-${run}`;
  const chamadaCreate = await req('POST', '/chamadas-publicas', admin, {
    editalId: edital.id, numero: numeroChamada, exercicio: 2026, objeto: 'Cenario ficticio de homologacao integrada SDD-008',
    dreId: dre.id, municipioId, inscricoesInicio: inicio, inscricoesFim: fim,
    escolaIds: escolasDre.map((e: any) => e.id), observacoes: 'Nao oficial - teste tecnico.',
  });
  const chamada = payload(chamadaCreate.data);
  context.chamadaId = chamada?.id;
  check('criar chamada publica', chamadaCreate.status === 201 && chamada?.status === 'RASCUNHO', '201/RASCUNHO', chamadaCreate.status);
  if (!chamada?.id) throw new Error('Chamada nao criada.');
  const update = await req('PATCH', `/chamadas-publicas/${chamada.id}`, admin, {
    editalId: edital.id, numero: numeroChamada, exercicio: 2026, objeto: 'Cenario ficticio SDD-008 editado', dreId: dre.id,
    municipioId, inscricoesInicio: inicio, inscricoesFim: fim, escolaIds: escolasDre.map((e: any) => e.id), versao: 1,
  });
  check('editar chamada em rascunho com versao', update.status === 200, '200', update.status);
  for (const status of ['PUBLICADA', 'INSCRICOES_ABERTAS']) {
    const r = await req('POST', `/chamadas-publicas/${chamada.id}/transicoes/${status}`, admin);
    check(`transicao chamada ${status}`, r.status < 300, '2xx', r.status);
  }

  const categorias = ['INDIVIDUAL', 'GRUPO_INFORMAL', 'GRUPO_FORMAL'];
  const projetos: any[] = [];
  for (let i = 0; i < 3; i++) {
    const inscricao = await req('POST', `/chamadas-publicas/${chamada.id}/inscricoes`, admin, { produtorId: produtores[i].id, categoria: categorias[i], contato: `e2e-${run}-${i}` });
    check(`inscricao categoria ${categorias[i]}`, inscricao.status === 201, '201', inscricao.status);
    const dup = await req('POST', `/chamadas-publicas/${chamada.id}/inscricoes`, admin, { produtorId: produtores[i].id, categoria: categorias[i] });
    check(`duplicidade inscricao ${categorias[i]}`, dup.status === 409, '409', dup.status);
    const projeto = await req('POST', `/chamadas-publicas/${chamada.id}/projetos`, admin, {
      produtorId: produtores[i].id, categoria: categorias[i], identificacaoProjeto: `PV-${run}-${i}`,
      // Oferta de 2 unidades e selecao de 1: preserva saldo contratual para
      // que a conciliacao fiscal valide quantidade faturada apos o recebimento.
      itens: [{ produto: item.produtoOriginal, editalItemId: item.id, quantidade: 2, unidade: item.unidade || 'KG', precoUnitario: 10 + i }],
    });
    const p = payload(projeto.data); projetos.push(p);
    check(`projeto de venda ${i + 1}`, projeto.status === 201 && !!p?.id, '201 + id', projeto.status);
    const enviado = await req('POST', `/chamadas-publicas/projetos/${p?.id}/enviar`, admin);
    check(`enviar projeto ${i + 1}`, enviado.status < 300, '2xx', enviado.status);
  }
  await req('POST', `/chamadas-publicas/${chamada.id}/transicoes/INSCRICOES_ENCERRADAS`, admin);
  await req('POST', `/chamadas-publicas/${chamada.id}/transicoes/EM_HABILITACAO`, admin);
  for (let i = 0; i < 3; i++) {
    const status = i === 2 ? 'PENDENTE_CORRECAO' : 'HABILITADO';
    const r = await req('POST', `/chamadas-publicas/projetos/${projetos[i].id}/habilitacao`, admin, { status, parecer: `Analise tecnica ficticia ${i + 1}`, pendencias: i === 2 ? 'Documento demonstrativo pendente.' : undefined });
    check(`habilitacao projeto ${i + 1}`, r.status < 300, '2xx', r.status);
  }
  const corrigido = await req('POST', `/chamadas-publicas/projetos/${projetos[2].id}/habilitacao`, admin, { status: 'HABILITADO', parecer: 'Pendencia corrigida no cenario de teste.' });
  check('correcao de pendencia documental', corrigido.status < 300, '2xx', corrigido.status);
  await req('POST', `/chamadas-publicas/${chamada.id}/transicoes/EM_SELECAO`, admin);
  const classificacoes: any[] = [];
  for (let i = 0; i < 2; i++) {
    const r = await req('POST', `/chamadas-publicas/${chamada.id}/classificacoes`, admin, { propostaId: projetos[i].id, editalItemId: item.id, prioridade: i + 1, criterio: 'Configuracao explicita do cenario SDD-008', valorConsiderado: i + 1, justificativa: 'Registro administrativo de teste.' });
    const c = payload(r.data); classificacoes.push(c);
    check(`classificacao projeto ${i + 1}`, r.status === 201 && !!c?.id, '201 + id', r.status);
    const s = await req('POST', `/chamadas-publicas/classificacoes/${c?.id}/selecao`, admin, { status: 'SELECIONADO', quantidade: 1, justificativa: 'Selecao parcial ficticia.' });
    check(`selecao parcial projeto ${i + 1}`, s.status < 300, '2xx', s.status);
  }
  await req('POST', `/chamadas-publicas/${chamada.id}/transicoes/RESULTADO_PRELIMINAR`, admin);
  await req('POST', `/chamadas-publicas/${chamada.id}/transicoes/EM_RECURSO`, admin);
  const recurso = await req('POST', `/chamadas-publicas/${chamada.id}/recursos`, admin, { produtorId: produtores[2].id, propostaId: projetos[2].id, fundamentacao: 'Recurso ficticio para validar trilha.' });
  const recursoId = payload(recurso.data)?.id;
  check('registrar recurso', recurso.status === 201 && !!recursoId, '201 + id', recurso.status);
  const decisao = await req('POST', `/chamadas-publicas/recursos/${recursoId}/decisao`, admin, { status: 'INDEFERIDO', decisao: 'Decisao administrativa de teste.' });
  check('decidir recurso', decisao.status < 300, '2xx', decisao.status);
  const homologacao = await req('POST', `/chamadas-publicas/${chamada.id}/homologacao`, admin, { fundamentacao: 'Homologacao tecnica ficticia, sem valor oficial.' });
  check('homologar chamada', homologacao.status === 201, '201', homologacao.status);

  const contratos: any[] = [];
  for (let i = 0; i < 2; i++) {
    const origin = await req('POST', `/chamadas-publicas/projetos/${projetos[i].id}/encaminhar-contrato`, admin);
    let contrato = payload(origin.data);
    check(`encaminhar contrato ${i + 1}`, origin.status === 201 && !!contrato?.id, '201 + id', origin.status);
    const patchContract = await req('PATCH', `/contratos/${contrato?.id}`, admin, {
      versao: contrato?.versao ?? 1, numero: `SDD008-${run}-${i}`, escolaId: escolasDre[i % escolasDre.length].id, dreId: dre.id,
      municipioId, vigenciaInicio: '2026-01-01', vigenciaFim: '2026-12-31', objeto: 'Contrato ficticio SDD-008',
    });
    contrato = payload(patchContract.data);
    check(`qualificar contrato ${i + 1}`, patchContract.status === 200 && contrato?.escolaId === escolasDre[i % escolasDre.length].id, '200 + escopo', patchContract.status);
    const minuta = await req('POST', `/contratos/${contrato.id}/minuta`, admin);
    check(`gerar minuta contrato ${i + 1}`, minuta.status < 300, '2xx', minuta.status);
    const valid = await req('POST', `/contratos/${contrato.id}/validar`, admin);
    check(`validar contrato ${i + 1}`, valid.status < 300, '2xx', valid.status);
    const conf = await req('POST', `/contratos/${contrato.id}/encaminhar-conferencia`, admin);
    check(`encaminhar conferencia contrato ${i + 1}`, conf.status < 300, '2xx', conf.status);
    const assinatura = await req('POST', `/contratos/${contrato.id}/enviar-assinatura`, admin, { signatarios: [{ nome: 'Responsavel DRE SDD-008', papel: 'CONTRATANTE' }, { nome: 'Fornecedor ficticio SDD-008', papel: 'CONTRATADO' }] });
    check(`enviar assinatura contrato ${i + 1}`, assinatura.status < 300, '2xx', assinatura.status);
    const form = multipart({ tipo: 'CONTRATO_ASSINADO', titulo: 'Instrumento ficticio SDD-008' }, { field: 'arquivo', name: `contrato-sdd008-${i}.pdf`, type: 'application/pdf', data: Buffer.from('%PDF-1.4\nSDD-008 TESTE\n%%EOF') });
    const upload = await fetch(`${BASE}/contratos/${contrato.id}/documentos`, { method: 'POST', headers: { authorization: `Bearer ${admin}`, 'content-type': form.contentType }, body: new Uint8Array(form.body) });
    const uploadData = upload.headers.get('content-type')?.includes('json') ? await upload.json() : {};
    const documentoId = payload(uploadData)?.id;
    check(`anexar documento contrato ${i + 1}`, upload.status < 300 && !!documentoId, '2xx + documento', upload.status);
    const formal = await req('POST', `/contratos/${contrato.id}/formalizar`, admin, { dataFormalizacao: '2026-10-12', documentoId });
    contrato = payload(formal.data);
    check(`formalizar contrato ${i + 1}`, formal.status < 300 && contrato?.status === 'VIGENTE', '2xx/VIGENTE', `${formal.status}/${contrato?.status}`);
    contratos.push(contrato);
  }
  context.contratoIds = contratos.map((c) => c.id);

  let primeiraEntrega: any;
  let primeiraNota: any;
  for (let i = 0; i < contratos.length; i++) {
    const contrato = contratos[i];
    const ci = contrato.itens?.[0];
    const prog = await req('POST', '/programacoes-entrega', admin, { contratoId: contrato.id, unidadeEscolarId: contrato.escolaId, numero: `SDD008-P-${run}-${i}`, dataPrevista: '2026-10-15', itens: [{ contratoItemId: ci.id, quantidadeProgramada: '1' }] });
    const programacao = payload(prog.data);
    check(`programar entrega ${i + 1}`, prog.status === 201 && !!programacao?.id, '201 + id', `${prog.status}/${JSON.stringify(payload(prog.data))}`);
    const programada = await req('PATCH', `/programacoes-entrega/${programacao?.id}/status`, admin, { para: 'PROGRAMADA' });
    check(`marcar programacao ${i + 1} como programada`, programada.status < 300, '2xx', programada.status);
    const confirmado = await req('POST', `/programacoes-entrega/${programacao?.id}/confirmar`, admin, { idempotencyKey: `sdd008-prog-${run}-${i}` });
    check(`confirmar programacao ${i + 1}`, confirmado.status < 300, '2xx', confirmado.status);
    const entrega = await req('POST', '/entregas', admin, { programacaoId: programacao.id, numero: `SDD008-E-${run}-${i}`, dataEntrega: '2026-10-16', itens: [{ programacaoItemId: programacao.itens?.[0]?.id, quantidadeInformada: '1', quantidadeAceita: '1', quantidadeRejeitada: '0' }] });
    const e = payload(entrega.data); primeiraEntrega = primeiraEntrega ?? e;
    check(`registrar recebimento parcial ${i + 1}`, entrega.status === 201 && !!e?.id, '201 + id', entrega.status);
    const emConferencia = await req('PATCH', `/entregas/${e?.id}/status`, admin, { para: 'EM_CONFERENCIA' });
    const conf = await req('POST', `/entregas/${e?.id}/conferir`, admin, { idempotencyKey: `sdd008-ent-conf-${run}-${i}` });
    const aceito = await req('POST', `/entregas/${e?.id}/aceitar`, admin, { idempotencyKey: `sdd008-ent-aceite-${run}-${i}` });
    check(`aceitar recebimento ${i + 1}`, emConferencia.status < 300 && conf.status < 300 && aceito.status < 300, '3x 2xx', `${emConferencia.status}/${conf.status}/${aceito.status}`);
    if (i === 0) {
      const unitario = Number(ci.valorUnitario).toFixed(2);
      const nota = await req('POST', '/notas-fiscais', admin, { contratoId: contrato.id, fornecedorId: contrato.produtorId, numero: `NF-${run}`, serie: '1', modelo: '55', dataEmissao: '2026-10-16T10:00:00.000Z', valorProdutos: unitario, valorTotal: unitario, itens: [{ numeroItem: 1, descricao: ci.produto, unidadeComercial: ci.unidade, quantidade: '1', valorUnitario: unitario, valorTotal: unitario, contratoItemId: ci.id }] });
      primeiraNota = payload(nota.data);
      check('cadastrar nota fiscal manual', nota.status === 201 && !!primeiraNota?.id, '201 + id', `${nota.status}/${JSON.stringify(payload(nota.data))}`);
      const ni = primeiraNota?.itens?.[0]; const ei = e?.itens?.[0];
      const vinculo = await req('POST', `/notas-fiscais/${primeiraNota?.id}/recebimentos`, admin, { notaFiscalItemId: ni?.id, entregaId: e?.id, entregaItemId: ei?.id, quantidadeVinculada: '1' });
      check('associar recebimento a nota', vinculo.status < 300, '2xx', vinculo.status);
      const processada = await req('PATCH', `/notas-fiscais/${primeiraNota?.id}`, admin, { status: 'PROCESSADA', motivo: 'Processamento manual do cenario SDD-008' });
      check('processar nota fiscal manual', processada.status < 300, '2xx', processada.status);
      const conc = await req('POST', `/notas-fiscais/${primeiraNota?.id}/conciliar`, admin); check('conciliar nota', conc.status < 300, '2xx', conc.status);
      const conferencia = await req('POST', `/notas-fiscais/${primeiraNota?.id}/conferencia`, admin, { acao: 'APROVAR', checklist: [{ item: 'Documento ficticio', conforme: true }] }); check('aprovar conferencia fiscal', conferencia.status < 300, '2xx', `${conferencia.status}/${JSON.stringify(payload(conferencia.data))}`);
      const atesto = await req('POST', `/notas-fiscais/${primeiraNota?.id}/atestos`, admin, { tipo: 'INTEGRAL', valorAtestado: unitario, dataAtesto: '2026-10-16' });
      const a = payload(atesto.data); check('atestar nota', atesto.status < 300 && !!a?.id, '2xx + id', `${atesto.status}/${JSON.stringify(payload(atesto.data))}`);
      const liquidacao = await req('POST', '/liquidacoes', admin, { notaFiscalId: primeiraNota.id, atestoId: a?.id, numeroProcesso: `PROC-${run}`, valorLiquidado: unitario, dataLiquidacao: '2026-10-17' });
      const l = payload(liquidacao.data); check('liquidar nota', liquidacao.status < 300 && !!l?.id, '2xx + id', `${liquidacao.status}/${JSON.stringify(payload(liquidacao.data))}`);
      const totalPagamento = Number(unitario);
      const primeiraParcela = (totalPagamento * 0.4).toFixed(2);
      const parcelaFinal = (totalPagamento - Number(primeiraParcela)).toFixed(2);
      const p1 = await req('POST', '/pagamentos', admin, { liquidacaoId: l?.id, valorPago: primeiraParcela, tipo: 'PARCIAL', dataPagamento: '2026-10-18', numeroOrdemPagamento: `OP-${run}-1` });
      const p2 = await req('POST', '/pagamentos', admin, { liquidacaoId: l?.id, valorPago: parcelaFinal, tipo: 'INTEGRAL', dataPagamento: '2026-10-19', numeroOrdemPagamento: `OP-${run}-2` });
      check('pagamentos parciais e saldo', p1.status < 300 && p2.status < 300, '2x 2xx', `${p1.status}/${JSON.stringify(payload(p1.data))}/${p2.status}/${JSON.stringify(payload(p2.data))}`);
    }
  }
  const estorno = await req('POST', `/entregas/${primeiraEntrega?.id}/estornar`, admin, { motivo: 'Estorno controlado do cenario E2E SDD-008' });
  const entregaEstornada = payload(estorno.data);
  check('estorno real sem exclusao fisica', estorno.status < 300 && entregaEstornada?.status === 'CANCELADA', '2xx + status CANCELADA', `${estorno.status}/${entregaEstornada?.status}`);
  const estornoNegado = await req('POST', `/entregas/${primeiraEntrega?.id}/estornar`, extensionista, { motivo: 'Nao autorizado' });
  check('estorno bloqueado para EXTENSIONISTA', estornoNegado.status === 403, '403', estornoNegado.status);

  const demonstrativo = await req('GET', `/prestacoes-contas/demonstrativo?exercicio=2026&contratoId=${encodeURIComponent(contratos[0].id)}`, admin);
  const demo = payload(demonstrativo.data);
  check('demonstrativo confere contrato de origem', demonstrativo.status === 200 && demo?.linhas?.some((l: any) => l.contratoId === contratos[0].id), '200 + linha do contrato', demonstrativo.status);
  for (const format of ['csv', 'xlsx', 'pdf']) {
    const exp = await req('GET', `/prestacoes-contas/exportar/${format}?exercicio=2026&contratoId=${encodeURIComponent(contratos[0].id)}`, admin);
    const b = exp.data as Buffer; const sig = format === 'pdf' ? b.subarray(0, 4).toString() : format === 'xlsx' ? b.subarray(0, 2).toString() : b.subarray(0, 3).toString();
    check(`exportacao ${format}`, exp.status === 200 && b.length > 20 && (format === 'pdf' ? sig === '%PDF' : format === 'xlsx' ? sig === 'PK' : sig.includes('\uFEFF')), '200 + assinatura valida', `${exp.status}/${b.length}/${sig}`);
  }
  const prestacao = await req('POST', '/prestacoes-contas', admin, { exercicio: 2026, periodoInicio: '2026-01-01T00:00:00.000Z', periodoFim: '2026-12-31T23:59:59.000Z', dreId: dre.id, observacoes: 'Cenario ficticio SDD-008' });
  const pc = payload(prestacao.data); check('criar prestacao de contas', prestacao.status === 201 && !!pc?.id, '201 + id', prestacao.status);
  if (pc?.id) {
    for (const status of ['EM_CONFERENCIA', 'ENVIADA', 'EM_ANALISE', 'APROVADA']) { const t = await req('POST', `/prestacoes-contas/${pc.id}/transicoes/${status}`, admin); check(`prestacao ${status}`, t.status < 300, '2xx', t.status); }
  }
  const audit = await req('GET', '/audit?limit=100', admin);
  check('trilha de auditoria integrada', audit.status === 200 && (payload(audit.data)?.items ?? []).length > 0, '200 + logs', audit.status);
  const publicView = await req('GET', '/transparencia/contratos');
  const publicText = JSON.stringify(publicView.data);
  check('transparencia publica sanitizada', publicView.status === 200 && !/cpf|cnpj|bancad|token|arquivoPath|documentoPath/i.test(publicText), '200 sem dados restritos', publicView.status);

  const output = { ...context, generatedAt: new Date().toISOString(), passed: results.filter((r) => r.ok).length, total: results.length, results };
  await writeFile('scripts/e2e-sdd008-last-run.json', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output));
  if (output.passed !== output.total) process.exitCode = 1;
}

main().catch(async (error) => {
  const output = { ...context, generatedAt: new Date().toISOString(), error: String(error), passed: results.filter((r) => r.ok).length, total: results.length, results };
  await writeFile('scripts/e2e-sdd008-last-run.json', JSON.stringify(output, null, 2));
  console.error(error); process.exitCode = 1;
});
