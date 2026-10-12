import { Prisma } from '@prisma/client';
import { presentNotaFiscalDetail, presentNotaFiscalList } from './fiscal-presenter';

const decimal = (valor: string) => new Prisma.Decimal(valor);

function baseRegistro(): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    serie: '1',
    modelo: '55',
    chaveAcesso: '35261111222333444455555555555555555111111111',
    dataEmissao: new Date('2026-09-01'),
    dataRecebimento: new Date('2026-09-05'),
    cnpjEmitente: '11222333000144',
    documentoDestinatario: '99988877700066',
    valorProdutos: decimal('1000.00'),
    valorTotal: decimal('1000.00'),
    valorDesconto: decimal('0.00'),
    valorFrete: decimal('0.00'),
    valorOutrasDespesas: decimal('0.00'),
    status: 'AGUARDANDO_ATESTO',
    resultadoConciliacao: 'CONCILIADA',
    fornecedorId: 'fornecedor-1',
    contratoId: 'contrato-1',
    xmlDocumentoId: null,
    pdfDocumentoId: null,
    observacoes: 'sem observações',
    createdAt: new Date('2026-09-05'),
    fornecedor: { id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: '11222333000144' },
    contrato: { id: 'contrato-1', numero: 'C-001', exercicio: 2026 },
    itens: [
      {
        id: 'item-1',
        numeroItem: 1,
        descricao: 'Arroz',
        quantidade: decimal('10.0000'),
        valorUnitario: decimal('100.0000'),
        valorTotal: decimal('1000.00'),
        contratoItem: { id: 'ci-1', produto: 'Arroz', unidade: 'KG' },
      },
    ],
    documentos: [],
    divergencias: [
      { id: 'div-1', tipo: 'VALOR_UNITARIO_DIVERGENTE', severidade: 'MEDIA', descricao: 'divergência', status: 'ABERTA', notaFiscalItemId: 'item-1' },
    ],
    conferencias: [],
    atestos: [
      {
        id: 'atesto-1',
        notaFiscalId: 'nf-1',
        status: 'ATESTADO',
        valorAtestado: decimal('1000.00'),
        dataAtesto: new Date('2026-09-10'),
        responsavelId: 'u1',
        justificativa: null,
        hashSha256: null,
        versao: 1,
      },
    ],
    vinculosRecebimento: [],
  };
}

describe('SDD-005: presenter da nota fiscal', () => {
  it('apresenta fornecedor e contrato aninhados e mantém o resumo plano', () => {
    const apresentado = presentNotaFiscalList(baseRegistro());

    expect(apresentado.fornecedor).toEqual({ id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: '11222333000144' });
    expect(apresentado.contrato).toEqual({ id: 'contrato-1', numero: 'C-001', exercicio: 2026 });
    expect(apresentado.fornecedorNome).toBe('Produtor X');
    expect(apresentado.contratoNumero).toBe('C-001');
    expect(apresentado.valorTotal.toString()).toBe('1000');
    expect(apresentado.itens).toHaveLength(1);
    expect(apresentado.divergencias).toHaveLength(1);
    expect(apresentado.atestos).toHaveLength(1);
  });

  it('deriva o tipo de atesto e o comprovante a partir do hash', () => {
    const registro = baseRegistro();
    const apresentado = presentNotaFiscalList(registro);

    // 1000.00 atestado sobre nota de 1000.00 => integral
    expect(apresentado.atestos[0].tipo).toBe('INTEGRAL');
    expect(apresentado.atestos[0].comprovante).toBeNull();

    const semComprovante = presentNotaFiscalList({ ...registro, atestos: [{ ...(registro.atestos as unknown[])[0] as Record<string, unknown>, valorAtestado: decimal('500.00'), hashSha256: 'abc123' }] });
    expect(semComprovante.atestos[0].tipo).toBe('PARCIAL');
    expect(semComprovante.atestos[0].comprovante).toEqual({ id: 'atesto-1', titulo: 'Comprovante de atesto', versao: 1 });
  });

  it('interpreta justificativa, ressalvas e checklist persistidos em JSON', () => {
    const registro = baseRegistro();
    registro.conferencias = [
      {
        id: 'conf-1',
        status: 'APROVADA',
        responsavelNome: 'Maria',
        dataConferencia: new Date('2026-09-08'),
        observacoes: 'ok',
        divergenciasJson: JSON.stringify({
          justificativa: 'conferido manualmente',
          ressalvas: 'sem ressalvas',
          checklist: [{ item: 'Itens conferidos', conforme: true, observacao: null }],
        }),
        createdAt: new Date('2026-09-08'),
      },
      // formato antigo (array de divergências da conciliação)
      {
        id: 'conf-2',
        status: 'COM_RESSALVAS',
        responsavelNome: null,
        dataConferencia: new Date('2026-09-07'),
        observacoes: null,
        divergenciasJson: JSON.stringify([{ tipo: 'OUTRA' }]),
        createdAt: new Date('2026-09-07'),
      },
      {
        id: 'conf-3',
        status: 'REJEITADA',
        responsavelNome: 'João',
        dataConferencia: new Date('2026-09-06'),
        observacoes: null,
        divergenciasJson: 'json inválido',
        createdAt: new Date('2026-09-06'),
      },
    ];

    const apresentado = presentNotaFiscalList(registro);
    const [primeira, segunda, terceira] = apresentado.conferencias;

    expect(primeira.conferente).toBe('Maria');
    expect(primeira.justificativa).toBe('conferido manualmente');
    expect(primeira.ressalvas).toBe('sem ressalvas');
    expect(primeira.checklist).toHaveLength(1);

    expect(segunda.justificativa).toBeNull();
    expect(segunda.checklist).toEqual([]);

    expect(terceira.conferente).toBe('João');
    expect(terceira.checklist).toEqual([]);
    expect(terceira.justificativa).toBeNull();
  });

  it('remove caminhos e hashes sensíveis do payload de lista', () => {
    const registro = { ...baseRegistro(), arquivoPath: '/etc/shadow', hashSha256: 'deadbeef' };
    const apresentado = presentNotaFiscalList(registro) as unknown as Record<string, unknown>;

    expect(apresentado.arquivoPath).toBeUndefined();
    expect(apresentado.hashSha256).toBeUndefined();
  });

  it('monta conciliação e recebimentos no detalhe', () => {
    const registro = baseRegistro();
    registro.vinculosRecebimento = [
      {
        id: 'vinc-1',
        entrega: { id: 'ent-1', numero: 'E-001', status: 'ACEITA', dataEntrega: new Date('2026-08-30'), aceitaEm: null },
      },
      { id: 'vinc-2', entrega: null },
    ];

    const detalhe = presentNotaFiscalDetail(registro);

    expect(detalhe.recebimentos).toHaveLength(1);
    expect(detalhe.recebimentos[0]).toEqual({
      id: 'ent-1',
      numero: 'E-001',
      status: 'ACEITA',
      dataRecebimento: new Date('2026-08-30'),
    });
    expect(detalhe.conciliacao).not.toBeNull();
    expect(detalhe.conciliacao?.status).toBe('CONCILIADA');
    expect(detalhe.conciliacao?.divergencias).toHaveLength(1);
    expect(detalhe.observacoes).toBe('sem observações');
    expect(detalhe.documentos).toEqual([]);
  });

  it('retorna conciliação nula quando a nota ainda não foi conciliada', () => {
    const registro = { ...baseRegistro(), resultadoConciliacao: null };
    const detalhe = presentNotaFiscalDetail(registro);

    expect(detalhe.conciliacao).toBeNull();
    expect(detalhe.recebimentos).toEqual([]);
  });

  it('detalha os vínculos de recebimento com quantidades e valores fiscais', () => {
    const registro = baseRegistro();
    registro.vinculosRecebimento = [
      {
        id: 'vinc-1',
        notaFiscalItemId: 'item-1',
        entregaId: 'ent-1',
        entregaItemId: 'ei-1',
        contratoItemId: 'ci-1',
        quantidadeVinculada: new Prisma.Decimal('10'),
        valorUnitarioFiscal: new Prisma.Decimal('9'),
        valorTotalVinculado: new Prisma.Decimal('90'),
        observacoes: 'Conferido com a DRE',
        entrega: { id: 'ent-1', numero: 'E-001', status: 'ACEITA' },
      },
      { entrega: { id: 'ent-2', numero: 'E-002', status: 'ACEITA' } },
    ];

    const detalhe = presentNotaFiscalDetail(registro);

    expect(detalhe.vinculos).toHaveLength(1);
    expect(detalhe.vinculos[0]).toEqual({
      id: 'vinc-1',
      notaFiscalItemId: 'item-1',
      entregaId: 'ent-1',
      entregaNumero: 'E-001',
      entregaStatus: 'ACEITA',
      entregaItemId: 'ei-1',
      contratoItemId: 'ci-1',
      quantidadeVinculada: new Prisma.Decimal('10'),
      valorUnitarioFiscal: new Prisma.Decimal('9'),
      valorTotalVinculado: new Prisma.Decimal('90'),
      observacoes: 'Conferido com a DRE',
    });
  });
});
