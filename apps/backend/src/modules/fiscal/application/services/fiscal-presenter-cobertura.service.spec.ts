import { Prisma } from '@prisma/client';
import { presentNotaFiscalDetail, presentNotaFiscalList } from './fiscal-presenter';

function D(valor: string): Prisma.Decimal {
  return new Prisma.Decimal(valor);
}

const agora = new Date('2026-03-01T12:00:00.000Z');

function base(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    serie: '1',
    modelo: '55',
    chaveAcesso: '35261111222333444455555555555555555111111111',
    dataEmissao: new Date('2026-01-02T00:00:00.000Z'),
    dataRecebimento: new Date('2026-01-03T00:00:00.000Z'),
    cnpjEmitente: '11222333000144',
    cpfEmitente: null,
    documentoDestinatario: 'documento-sensivel',
    valorProdutos: D('900.00'),
    valorTotal: D('1000.00'),
    valorDesconto: D('0.00'),
    valorFrete: D('100.00'),
    valorOutrasDespesas: D('0.00'),
    status: 'PROCESSADA',
    resultadoConciliacao: null,
    fornecedorId: 'fornecedor-1',
    contratoId: 'contrato-1',
    xmlDocumentoId: null,
    pdfDocumentoId: null,
    observacoes: 'nota',
    createdAt: agora,
    ...overrides,
  };
}

describe('SDD-005: presenter da nota fiscal (ramificações de fallback)', () => {
  describe('presentNotaFiscalList', () => {
    it('preenche fallbacks quando faltam fornecedor, contrato e relacionamentos', () => {
      const resultado = presentNotaFiscalList(base());

      expect(resultado.nomeEmitente).toBe('');
      expect(resultado.fornecedorNome).toBe('');
      expect(resultado.fornecedorCpfCnpj).toBeNull();
      expect(resultado.fornecedor).toEqual({ id: 'fornecedor-1', nome: '', cpfCnpj: null });
      expect(resultado.contrato).toEqual({ id: 'contrato-1', numero: '', exercicio: 0 });
      expect(resultado.itens).toEqual([]);
      expect(resultado.divergencias).toEqual([]);
      expect(resultado.conferencias).toEqual([]);
      expect(resultado.atestos).toEqual([]);
    });

    it('usa o fornecedor/contrato carregados e o nome de emitente explícito quando presentes', () => {
      const resultado = presentNotaFiscalList(
        base({
          nomeEmitente: 'Emitente X',
          fornecedor: { id: 'f-9', nome: 'Fornecedor 9', cpfCnpj: '99888777000166' },
          contrato: { id: 'c-9', numero: 'C-009', exercicio: 2025 },
        }),
      );

      expect(resultado.nomeEmitente).toBe('Emitente X');
      expect(resultado.fornecedorNome).toBe('Fornecedor 9');
      expect(resultado.fornecedorCpfCnpj).toBe('99888777000166');
      expect(resultado.fornecedor).toEqual({ id: 'f-9', nome: 'Fornecedor 9', cpfCnpj: '99888777000166' });
      expect(resultado.contrato).toEqual({ id: 'c-9', numero: 'C-009', exercicio: 2025 });
    });

    it('formata itens com e sem item de contrato vinculado', () => {
      const resultado = presentNotaFiscalList(
        base({
          itens: [
            {
              id: 'item-1',
              numeroItem: 1,
              codigoProduto: 'PROD-1',
              descricao: 'Arroz',
              ncm: '10063010',
              cfop: '1102',
              unidadeComercial: 'KG',
              quantidade: D('10'),
              valorUnitario: D('9'),
              valorTotal: D('90'),
              contratoItemId: 'ci-1',
              contratoItem: { produto: 'Arroz tipo 1', unidade: 'KG' },
            },
            {
              id: 'item-2',
              numeroItem: 2,
              codigoProduto: null,
              descricao: 'Feijão',
              ncm: null,
              cfop: null,
              unidadeComercial: null,
              quantidade: D('5'),
              valorUnitario: D('10'),
              valorTotal: D('50'),
              contratoItemId: null,
            },
          ],
        }),
      );

      expect(resultado.itens[0].contratoItemProduto).toBe('Arroz tipo 1');
      expect(resultado.itens[0].contratoItemUnidade).toBe('KG');
      expect(resultado.itens[1].contratoItemProduto).toBeNull();
      expect(resultado.itens[1].contratoItemUnidade).toBeNull();
    });

    it('formata conferências com JSON inválido, em array e com campos ausentes', () => {
      const resultado = presentNotaFiscalList(
        base({
          conferencias: [
            {
              id: 'conf-1',
              status: 'APROVADA',
              responsavelNome: null,
              dataConferencia: null,
              createdAt: agora,
              observacoes: null,
              divergenciasJson: '{quebrado',
            },
            {
              id: 'conf-2',
              status: 'REJEITADA',
              responsavelNome: 'dre@x.com',
              dataConferencia: new Date('2026-02-01T00:00:00.000Z'),
              createdAt: agora,
              observacoes: 'rejeitada',
              divergenciasJson: JSON.stringify([{ tipo: 'VALOR_DIVERGENTE' }]),
            },
            {
              id: 'conf-3',
              status: 'APROVADA',
              responsavelNome: 'dre@x.com',
              dataConferencia: new Date('2026-02-02T00:00:00.000Z'),
              createdAt: agora,
              observacoes: null,
              divergenciasJson: JSON.stringify({ justificativa: 'ok', ressalvas: null, checklist: 'não é lista' }),
            },
            {
              id: 'conf-4',
              status: 'APROVADA',
              responsavelNome: 'dre@x.com',
              dataConferencia: new Date('2026-02-03T00:00:00.000Z'),
              createdAt: agora,
              observacoes: null,
              divergenciasJson: JSON.stringify({ justificativa: null, ressalvas: 'leve', checklist: [{ item: 'NF conferida', conforme: true }] }),
            },
          ],
        }),
      );

      const [inválida, emArray, semChecklist, comChecklist] = resultado.conferencias;
      expect(inválida).toEqual(
        expect.objectContaining({ conferente: null, justificativa: null, ressalvas: null, checklist: [], dataConferencia: agora }),
      );
      expect(emArray).toEqual(
        expect.objectContaining({ conferente: 'dre@x.com', justificativa: null, ressalvas: null, checklist: [] }),
      );
      expect(semChecklist).toEqual(expect.objectContaining({ justificativa: 'ok', ressalvas: null, checklist: [] }));
      expect(comChecklist).toEqual(
        expect.objectContaining({
          justificativa: null,
          ressalvas: 'leve',
          checklist: [{ item: 'NF conferida', conforme: true }],
        }),
      );
    });

    it('classifica atestos como INTEGRAL/PARCIAL e expõe comprovante conforme o hash', () => {
      const resultado = presentNotaFiscalList(
        base({
          valorTotal: D('1000.00'),
          atestos: [
            {
              id: 'a1',
              notaFiscalId: 'nf-1',
              status: 'ATESTADO',
              valorAtestado: D('1000.00'),
              dataAtesto: agora,
              responsavelId: 'u1',
              justificativa: null,
              hashSha256: 'abc123',
              versao: 2,
            },
            {
              id: 'a2',
              notaFiscalId: 'nf-1',
              status: 'ATESTADO',
              valorAtestado: D('100.00'),
              dataAtesto: agora,
              responsavelId: 'u1',
              justificativa: 'parcial',
              hashSha256: null,
              versao: 1,
            },
          ],
        }),
      );

      expect(resultado.atestos[0]).toEqual(
        expect.objectContaining({ tipo: 'INTEGRAL', comprovante: { id: 'a1', titulo: 'Comprovante de atesto', versao: 2 } }),
      );
      expect(resultado.atestos[1]).toEqual(expect.objectContaining({ tipo: 'PARCIAL', comprovante: null }));
    });

    it('deriva o total do atesto do próprio atesto quando a nota não informa valorTotal', () => {
      const resultado = presentNotaFiscalList(
        base({
          valorTotal: undefined,
          atestos: [
            {
              id: 'a3',
              status: 'ATESTADO',
              valorAtestado: D('600.00'),
              dataAtesto: agora,
              responsavelId: 'u1',
              justificativa: null,
              hashSha256: null,
              notaFiscal: { valorTotal: D('500.00') },
            },
          ],
        }),
      );

      expect(resultado.atestos[0]).toEqual(expect.objectContaining({ notaFiscalId: '', tipo: 'INTEGRAL' }));
    });
  });

  describe('presentNotaFiscalDetail', () => {
    it('formata documentos, recebimentos e conciliação com os campos disponíveis', () => {
      const resultado = presentNotaFiscalDetail(
        base({
          divergencias: [
            { id: 'div-1', tipo: 'VALOR_DIVERGENTE', severidade: 'MEDIA', descricao: 'valor', status: 'ABERTA', notaFiscalItemId: 'item-1' },
          ],
          documentos: [
            {
              id: 'doc-1',
              tipo: 'XML',
              versao: 1,
              titulo: 'XML NF-e 12345',
              arquivoNome: 'doc.xml',
              mimeType: 'application/xml',
              tamanhoBytes: 120,
              hashSha256: 'abc123',
              createdAt: agora,
            },
          ],
          vinculosRecebimento: [
            { entrega: { id: 'e1', numero: 'E-1', status: 'ACEITA', dataEntrega: agora, aceitaEm: null } },
            { entrega: { id: 'e2', status: 'ACEITA', dataEntrega: null, aceitaEm: agora } },
            { entrega: null },
            {},
            { entrega: { id: 'e3', numero: 'E-3', status: 'EM_TRANSITO' } },
          ],
          resultadoConciliacao: 'CONCILIADA',
        }),
      );

      expect(resultado.documentos).toEqual([
        {
          id: 'doc-1',
          tipo: 'XML',
          versao: 1,
          titulo: 'XML NF-e 12345',
          arquivoNome: 'doc.xml',
          mimeType: 'application/xml',
          tamanhoBytes: 120,
          hashSha256: 'abc123',
          createdAt: agora,
        },
      ]);
      expect(resultado.recebimentos).toEqual([
        { id: 'e1', numero: 'E-1', status: 'ACEITA', dataRecebimento: agora },
        { id: 'e2', numero: '', status: 'ACEITA', dataRecebimento: agora },
        { id: 'e3', numero: 'E-3', status: 'EM_TRANSITO', dataRecebimento: null },
      ]);
      expect(resultado.conciliacao).toEqual({ status: 'CONCILIADA', divergencias: resultado.divergencias });
    });

    it('mantém conciliação nula quando a nota não possui resultado', () => {
      const resultado = presentNotaFiscalDetail(base({ resultadoConciliacao: null }));

      expect(resultado.conciliacao).toBeNull();
    });
  });
});
