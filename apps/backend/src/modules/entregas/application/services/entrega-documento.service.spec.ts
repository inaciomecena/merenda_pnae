import { EntregaDocumentoService } from './entrega-documento.service';

describe('SDD-004: termo de recebimento', () => {
  it('gera PDF real após aceite sem declarar assinatura digital', async () => {
    const service = new EntregaDocumentoService({} as any, {} as any, {} as any);
    const entrega = {
      status: 'ACEITA', numero: 'ENT-2026-1', dataEntrega: new Date('2026-10-11T12:00:00Z'),
      conferidaPor: 'conferente', aceitaPor: 'conferente', observacoes: 'Conferido na escola',
      programacao: { contrato: { numero: 'CT-1', exercicio: 2026, edital: { numero: '001', ano: 2026 } } },
      fornecedor: { nome: 'Cooperativa' }, unidadeEscolar: { nome: 'Escola Municipal' },
      itens: [{ programacaoItem: { produto: 'Banana', unidadeMedida: 'kg' }, quantidadeInformada: '120', quantidadeAceita: '100', quantidadeRejeitada: '20', motivoRejeicao: 'Avaria' }],
      ocorrencias: [{ tipo: 'PRODUTO_DANIFICADO', descricao: 'Caixas danificadas' }],
    };
    jest.spyOn(service as any, 'obterEntrega').mockResolvedValue(entrega);
    const salvar = jest.spyOn(service as any, 'salvar').mockImplementation(async (...args: unknown[]) => ({ assinaturaDigital: false, bytes: args[4] as Buffer }));
    const resultado = await service.gerarTermo('e1', { sub: 'u1', role: 'ESCOLA' }) as unknown as { assinaturaDigital: boolean; bytes: Buffer };
    expect(resultado.assinaturaDigital).toBe(false);
    expect(resultado.bytes.subarray(0, 4).toString()).toBe('%PDF');
    expect(resultado.bytes.length).toBeGreaterThan(1000);
    expect(salvar).toHaveBeenCalledWith('e1', expect.anything(), 'TERMO_RECEBIMENTO', expect.any(String), expect.any(Buffer), 'application/pdf', 'pdf');
  });
});
