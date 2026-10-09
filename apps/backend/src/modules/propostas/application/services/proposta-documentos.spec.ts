import { camposDosModelos, PropostaDocumentosService, validarDocumentos, ModeloPropostaSnapshot } from './proposta-documentos.service';
import { MODELOS_DRE } from '../../../composicao-editais/application/domain/templates-dre';
import { validarPlaceholders } from '../../../composicao-editais/application/domain/placeholders';

function modelos(perfil: string): ModeloPropostaSnapshot[] {
  return MODELOS_DRE.filter(m => m.perfilFornecedor === perfil).map((m, i) => ({ ...m, perfilFornecedor: perfil, templateId: `modelo-${i}`, versaoId: `versao-${i}`, numero: 1 }));
}

describe('modelos da DRE e documentos do produtor', () => {
  it('parametriza os 15 PDFs, sem variáveis desconhecidas ou dados do edital anterior', () => {
    expect(MODELOS_DRE).toHaveLength(15);
    for (const m of MODELOS_DRE) {
      expect(validarPlaceholders(m.conteudo).invalidos).toEqual([]);
      expect(m.conteudo).not.toMatch(/Alto Paraguai|170376\/2025|001\/2025|dmt\.coadm|drediamantino/);
    }
  });

  it.each(['INDIVIDUAL', 'FORMAL', 'INFORMAL', 'EFR'])('exige os campos usados pelo perfil %s e aceita o preenchimento completo', perfil => {
    const ms = modelos(perfil);
    const campos = camposDosModelos(ms);
    expect(campos.some(c => c.chave === (perfil === 'INFORMAL' ? 'representante.cpf' : 'produtor.cpfCnpj') && c.obrigatorio)).toBe(true);
    expect(validarDocumentos(ms, {})).not.toEqual([]);
    const valores = Object.fromEntries(campos.filter(c => c.obrigatorio).map(c => [c.chave, 'Dado preenchido']));
    expect(validarDocumentos(ms, valores)).toEqual([]);
    if (perfil === 'INDIVIDUAL') expect(campos.some(c => c.chave.startsWith('representante.'))).toBe(false);
  });

  it('rejeita a mistura de declarações de outro perfil e modelos fora da vigência', () => {
    const ms = [...modelos('INDIVIDUAL'), ...modelos('FORMAL')];
    ms[0].vigenciaFim = '2000-01-01';
    const erros = validarDocumentos(ms, {});
    expect(erros).toContain('O projeto e as declarações devem ser do mesmo perfil de fornecedor.');
    expect(erros.some(e => e.startsWith('Modelo vencido'))).toBe(true);
  });

  it('preserva o texto e a versão já salvos mesmo após alteração ou inativação do modelo da DRE', async () => {
    const anteriores = modelos('INDIVIDUAL');
    const config = { modelos: anteriores, valores: {}, salvoEm: '2026-01-01' };
    const proposta = { id: 'p1', documentosJson: JSON.stringify(config), status: 'RASCUNHO', produtor: null, itens: [], edital: { numero: '001', ano: 2026, escolasVinculadas: [], documento: null } };
    const prisma: any = { proposta: { findFirst: jest.fn().mockResolvedValue(proposta), update: jest.fn().mockResolvedValue({}) }, templateDocumento: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = new PropostaDocumentosService(prisma);
    await service.salvar('p1', { modelos: anteriores.map(m => ({ templateId: m.templateId, versaoId: m.versaoId })), valores: {} });
    const gravado = JSON.parse(prisma.proposta.update.mock.calls[0][0].data.documentosJson);
    expect(gravado.modelos).toEqual(anteriores);
  });

  it('impede alteração de proposta finalizada e acesso de extensionista de outro município', async () => {
    const prisma: any = { proposta: { findFirst: jest.fn().mockResolvedValue({ status: 'FINALIZADA', produtor: { municipioId: 'outro' } }), update: jest.fn() } };
    const service = new PropostaDocumentosService(prisma);
    await expect(service.salvar('p1', { modelos: [], valores: {} })).rejects.toThrow('finalizada');
    await expect(service.preparar('p1', { sub: 'u1', role: 'EXTENSIONISTA', municipioId: 'meu-municipio' })).rejects.toThrow('fora do seu município');
    expect(prisma.proposta.update).not.toHaveBeenCalled();
  });
});
