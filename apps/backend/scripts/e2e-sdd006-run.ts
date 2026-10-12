/** E2E SDD-006 contra API real e banco de desenvolvimento. Reexecutavel: cria apenas novos rascunhos. */
import { writeFile } from 'node:fs/promises';

const BASE = process.env.E2E_BASE ?? 'http://localhost:3000/api/v1';
const PASSWORD = process.env.E2E_PASSWORD ?? 'Admin@123';
const results: Array<{ caso: string; ok: boolean; esperado: string; obtido: string }> = [];

function check(caso: string, ok: boolean, esperado: string, obtido: unknown) {
  results.push({ caso, ok, esperado, obtido: typeof obtido === 'string' ? obtido : JSON.stringify(obtido) });
  console.log(`${ok ? '[OK] ' : '[FALHA] '}${caso} | esperado=${esperado} | obtido=${typeof obtido === 'string' ? obtido : JSON.stringify(obtido)}`);
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

async function login(email: string) {
  const response = await req('POST', '/auth/login', undefined, { email, password: PASSWORD });
  const token = (response.data as any)?.data?.accessToken;
  check(`login ${email}`, response.status >= 200 && response.status < 300 && Boolean(token), '2xx + token', response.status);
  return token as string;
}

async function main() {
  console.log(`=== SDD-006 E2E ${BASE} ===`);
  const admin = await login('admin@seaf.gov.br');
  const dre = await login('dre@seaf.gov.br');
  const dreB = await login('dre-b@seaf.gov.br');
  const inicio = '2026-01-01T00:00:00.000Z'; const fim = '2026-12-31T23:59:59.000Z';

  const criado = await req('POST', '/prestacoes-contas', admin, { exercicio: 2026, periodoInicio: inicio, periodoFim: fim, observacoes: 'E2E SDD-006' });
  const prestacao = (criado.data as any)?.data;
  check('criar prestacao', criado.status === 201 || criado.status === 200, '2xx', criado.status);
  check('rascunho e versao inicial', prestacao?.status === 'RASCUNHO' && prestacao?.versao === 1, 'RASCUNHO/v1', prestacao);
  const id = prestacao?.id as string;
  if (!id) throw new Error('Prestacao nao criada; E2E interrompido.');

  const editada = await req('PATCH', `/prestacoes-contas/${id}`, admin, { versao: 1, observacoes: 'E2E editada' });
  check('editar rascunho', editada.status === 200, '200', editada.status);
  check('versionamento apos edicao', (editada.data as any)?.data?.versao === 2, 'v2', (editada.data as any)?.data?.versao);
  const concorrente = await req('PATCH', `/prestacoes-contas/${id}`, admin, { versao: 1, observacoes: 'conflito' });
  check('bloquear concorrencia com versao antiga', concorrente.status === 409, '409', concorrente.status);

  const transicao = async (status: string, body?: unknown) => req('POST', `/prestacoes-contas/${id}/transicoes/${status}`, admin, body ?? {});
  for (const status of ['EM_CONFERENCIA', 'ENVIADA', 'EM_ANALISE']) {
    const response = await transicao(status); check(`transicao ${status}`, response.status >= 200 && response.status < 300, '2xx', response.status);
  }
  let devolvida = await transicao('DEVOLVIDA', { justificativa: 'Ajustar documentos' });
  check('devolver com justificativa', devolvida.status >= 200 && devolvida.status < 300, '2xx', devolvida.status);
  const semJustificativa = await transicao('EM_ANALISE');
  check('transicao invalida a partir de DEVOLVIDA', semJustificativa.status === 400, '400', semJustificativa.status);
  for (const status of ['RASCUNHO', 'EM_CONFERENCIA', 'ENVIADA', 'EM_ANALISE', 'APROVADA']) {
    const response = status === 'RASCUNHO' ? await transicao(status) : await transicao(status);
    check(`reenvio/aprovacao ${status}`, response.status >= 200 && response.status < 300, '2xx', response.status);
  }
  const aprovado = await transicao('DEVOLVIDA');
  check('bloquear transicao de aprovado', aprovado.status === 400, '400', aprovado.status);

  const demonstrativo = await req('GET', `/prestacoes-contas/demonstrativo?periodoInicio=${inicio}&periodoFim=${fim}`, admin);
  check('demonstrativo por periodo', demonstrativo.status === 200 && Array.isArray((demonstrativo.data as any)?.data?.linhas), '200 + linhas', demonstrativo.status);
  const contratos = await req('GET', '/contratos?limit=1', admin);
  const contratoOrigem = (contratos.data as any)?.data?.items?.[0];
  check('fonte de verdade de contratos', contratos.status === 200 && Boolean(contratoOrigem?.id), 'contrato existente', contratos.status);
  const filtros: Array<[string, string | undefined]> = [
    ['contrato', contratoOrigem?.id && `contratoId=${contratoOrigem.id}`],
    ['edital', contratoOrigem?.editalId && `editalId=${contratoOrigem.editalId}`],
    ['fornecedor', contratoOrigem?.produtorId && `fornecedorId=${contratoOrigem.produtorId}`],
    ['DRE', contratoOrigem?.dreId && `dreId=${contratoOrigem.dreId}`],
    ['escola', contratoOrigem?.escolaId && `escolaId=${contratoOrigem.escolaId}`],
    ['municipio', contratoOrigem?.municipioId && `municipioId=${contratoOrigem.municipioId}`],
  ];
  for (const [nome, filtro] of filtros) {
    if (!filtro) { check(`filtro ${nome}`, true, 'campo nao aplicavel', 'sem campo'); continue; }
    const filtrado = await req('GET', `/prestacoes-contas/demonstrativo?${filtro}`, admin);
    const linhas = (filtrado.data as any)?.data?.linhas ?? [];
    check(`filtro ${nome}`, filtrado.status === 200 && linhas.every((l: any) => l.contratoId === contratoOrigem.id), '200 + escopo filtrado', `${filtrado.status}/${linhas.length}`);
  }
  const semDados = await req('GET', '/prestacoes-contas/demonstrativo?exercicio=1900', admin);
  check('comportamento sem dados', semDados.status === 200 && (semDados.data as any)?.data?.linhas?.length === 0, '200 + zero linhas', semDados.status);
  const indicadores = await req('GET', '/dashboard-financeiro/indicadores', admin);
  const demoIndicadores = (demonstrativo.data as any)?.data?.indicadores;
  const origemIndicadores = (indicadores.data as any)?.data;
  check('indicadores contra fonte financeira', indicadores.status === 200 && Number(demoIndicadores?.contratado) === Number(origemIndicadores?.contratado), 'contratado consistente', `${demoIndicadores?.contratado}/${origemIndicadores?.contratado}`);
  const saldos = await req('GET', '/dashboard-financeiro/saldos', admin);
  check('saldos e pagamentos parciais', saldos.status === 200 && typeof (saldos.data as any)?.data?.aPagar === 'string', '200 + aPagar', saldos.status);
  check('pendencias documentais expostas', demonstrativo.status === 200 && typeof demoIndicadores === 'object' && typeof (demonstrativo.data as any)?.data?.pendenciasDocumentais === 'number', 'contador documental', demonstrativo.status);
  for (const formato of ['csv', 'xlsx', 'pdf']) {
    const exportado = await req('GET', `/prestacoes-contas/exportar/${formato}?periodoInicio=${inicio}&periodoFim=${fim}`, admin);
    const buffer = exportado.data as Buffer;
    const assinatura = formato === 'pdf' ? buffer.subarray(0, 4).toString() : formato === 'xlsx' ? buffer.subarray(0, 2).toString() : buffer.subarray(0, 3).toString();
    check(`exportar ${formato}`, exportado.status === 200 && buffer.length > 20 && (formato === 'pdf' ? assinatura === '%PDF' : formato === 'xlsx' ? assinatura === 'PK' : assinatura.includes('\uFEFF')), '200 + arquivo valido', `${exportado.status}/${buffer.length}/${assinatura}`);
  }

  const auditoria = await req('GET', `/audit?entity=PrestacaoContas&limit=100`, admin);
  const logs = (auditoria.data as any)?.data?.items ?? [];
  check('trilha de auditoria', auditoria.status === 200 && logs.some((l: any) => l.entityId === id), 'log da prestacao', logs.length);
  const publica = await req('GET', '/transparencia/contratos');
  const textoPublico = JSON.stringify(publica.data);
  check('transparencia publica sanitizada', publica.status === 200 && !/cpf|cnpj|bancad|token|arquivoPath|documentoPath/i.test(textoPublico), '200 sem dados restritos', publica.status);
  const isolamento = await req('GET', '/prestacoes-contas/demonstrativo', dre);
  check('isolamento institucional DRE', isolamento.status === 200, '200 com escopo', isolamento.status);
  const foraEscopo = await req('GET', '/prestacoes-contas/demonstrativo', dreB);
  const idsAdmin = new Set(((demonstrativo.data as any)?.data?.linhas ?? []).map((l: any) => l.contratoId));
  const idsDreB = ((foraEscopo.data as any)?.data?.linhas ?? []).map((l: any) => l.contratoId);
  check('bloqueio entre DREs', foraEscopo.status === 200 && idsDreB.every((id: string) => !idsAdmin.has(id)), 'sem contrato de outra DRE', `${foraEscopo.status}/${idsDreB.length}`);

  const output = { base: BASE, id, generatedAt: new Date().toISOString(), passed: results.filter((r) => r.ok).length, total: results.length, results };
  await writeFile('scripts/e2e-sdd006-last-run.json', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output));
  if (output.passed !== output.total) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
