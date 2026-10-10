import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PolicyService } from '../../../../common/auth/policy.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { CAMPOS_PRODUTOR } from '../../../composicao-editais/application/domain/campos-produtor';
import { catalogoPorChave, extrairPlaceholders, VARIAVEIS_DISPONIVEIS } from '../../../composicao-editais/application/domain/placeholders';
import { DocumentoRenderInput, renderDocx, renderPdf } from '../../../composicao-editais/application/domain/documento-renderer';
import { htmlParaTexto } from '../../../composicao-editais/application/domain/templates-padrao';
import { DocumentoPropostaDto } from '../../presentation/dto/documento-proposta.dto';

export interface ModeloPropostaSnapshot {
  templateId: string;
  versaoId: string;
  numero: number;
  titulo: string;
  tipo: string;
  finalidade: string;
  perfilFornecedor: string | null;
  conteudo: string;
  vigenciaInicio?: string | null;
  vigenciaFim?: string | null;
}

export interface ConfigDocumentos {
  modelos: ModeloPropostaSnapshot[];
  valores: Record<string, string>;
  salvoEm: string;
  salvoPor?: string;
}

const especiais = new Set(['itens', 'escolas', 'fornecedores', 'assinaturas']);
export function camposDosModelos(modelos: Array<{ conteudo: string }>) {
  return [...new Set(modelos.flatMap(m => extrairPlaceholders(m.conteudo)))].filter(chave => !especiais.has(chave)).map(chave => ({
    chave,
    rotulo: catalogoPorChave(chave)?.rotulo || chave,
    obrigatorio: CAMPOS_PRODUTOR.find(c => c[0] === chave)?.[2] ?? (['entidade.cnpj', 'edital.dataPublicacao'].includes(chave) || catalogoPorChave(chave)?.obrigatorio || false),
    multiline: chave.startsWith('grupo.') || chave === 'projeto.cronograma',
  }));
}

export function validarDocumentos(modelos: ModeloPropostaSnapshot[], valores: Record<string, string>): string[] {
  const erros: string[] = [];
  if (!modelos.some(m => m.finalidade === 'PROJETO_VENDA')) erros.push('Selecione um modelo de projeto de venda.');
  const perfis = new Set(modelos.map(m => m.perfilFornecedor).filter(Boolean));
  if (perfis.size > 1) erros.push('O projeto e as declarações devem ser do mesmo perfil de fornecedor.');
  for (const campo of camposDosModelos(modelos)) {
    if (campo.obrigatorio && !valores[campo.chave]?.trim()) erros.push(`Preencha ${campo.rotulo}.`);
  }
  for (const modelo of modelos) {
    if (!modelo.conteudo.trim()) erros.push(`Modelo sem texto editável: ${modelo.titulo}.`);
    if (modelo.vigenciaInicio && new Date(modelo.vigenciaInicio).getTime() > Date.now()) erros.push(`Modelo ainda fora da vigência: ${modelo.titulo}.`);
    if (modelo.vigenciaFim && new Date(modelo.vigenciaFim).getTime() < Date.now()) erros.push(`Modelo vencido: ${modelo.titulo}.`);
    const invalidas = extrairPlaceholders(modelo.conteudo).filter(chave => !catalogoPorChave(chave));
    if (invalidas.length) erros.push(`Variáveis desconhecidas: ${invalidas.join(', ')}.`);
  }
  return erros;
}

@Injectable()
export class PropostaDocumentosService {
  constructor(private readonly prisma: PrismaService, private readonly policy: PolicyService, private readonly audit: AuditService) {}

  private async carregar(id: string, user?: AuthenticatedUser) {
    const proposta = await this.prisma.proposta.findFirst({
      where: { id, deletedAt: null },
      include: {
        produtor: { include: { municipio: true } }, itens: { where: { deletedAt: null } },
        edital: { include: { municipio: true, escola: true, escolasVinculadas: { include: { escola: true } }, documento: { include: { variaveis: true, anexos: { include: { templateVersao: true } } } } } },
      },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada.');
    if ((user?.role === 'EXTENSIONISTA' || user?.role === 'REPRESENTANTE' || user?.role === 'PRODUTOR')) {
      if (!proposta.produtorId) throw new ForbiddenException('Proposta sem fornecedor representado.');
      await this.policy.requireProdutorAccess(user, proposta.produtorId);
    }
    if (user?.role === 'ESCOLA') throw new ForbiddenException('Documentos privados de proposta não pertencem à escola.');
    return proposta;
  }

  private config(json: string | null): ConfigDocumentos | null {
    if (!json) return null;
    return JSON.parse(json) as ConfigDocumentos;
  }

  async preparar(id: string, user?: AuthenticatedUser) {
    const proposta = await this.carregar(id, user);
    const templates = await this.prisma.templateDocumento.findMany({
      where: { deletedAt: null, ativo: true, finalidade: { in: ['PROJETO_VENDA', 'PRODUCAO_PROPRIA', 'CONTROLE_LIMITE'] } },
      include: { versoes: { orderBy: { numero: 'desc' }, take: 1 } },
      orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
    });
    const modelos = templates.flatMap(t => {
      const vinculo = proposta.edital.documento?.anexos.find(a => a.incluido && a.templateId === t.id);
      const fixada = vinculo?.templateVersao;
      const v = fixada && ['HTML', 'TEXTO'].includes(fixada.formato) && fixada.conteudo ? fixada : t.versoes[0];
      if (!v || !v.conteudo || !['HTML', 'TEXTO'].includes(v.formato)) return [];
      return [{ templateId: t.id, versaoId: v.id, numero: v.numero, titulo: v.titulo, tipo: t.tipo,
        finalidade: t.finalidade, perfilFornecedor: t.perfilFornecedor, conteudo: v.conteudo,
        vigenciaInicio: v.vigenciaInicio?.toISOString(), vigenciaFim: v.vigenciaFim?.toISOString(),
        vinculadoEdital: !!fixada && v.id === fixada.id }];
    });
    const salvo = this.config(proposta.documentosJson);
    const valores = this.valoresAutomaticos(proposta);
    const selecionados = salvo?.modelos || modelos.filter(m => m.perfilFornecedor === 'INDIVIDUAL');
    return { modelos, selecionados, valores: { ...valores, ...salvo?.valores }, campos: camposDosModelos([...modelos, ...(salvo?.modelos || [])]), status: proposta.status };
  }

  async salvar(id: string, dto: DocumentoPropostaDto, user?: AuthenticatedUser) {
    const proposta = await this.carregar(id, user);
    if (user && user.role !== 'ADMIN' && proposta.produtorId) await this.policy.requireProdutorAction(user, proposta.produtorId, 'EDITAR_PROPOSTA');
    if (['FINALIZADA', 'CANCELADA'].includes(proposta.status)) throw new BadRequestException('Proposta finalizada ou cancelada não pode ser alterada.');
    if (!dto.modelos.length) throw new BadRequestException('Selecione os modelos para o projeto.');
    if (new Set(dto.modelos.map(m => m.templateId)).size !== dto.modelos.length) throw new BadRequestException('Há modelos duplicados.');
    const disponiveis = await this.preparar(id, user);
    const anterior = this.config(proposta.documentosJson);
    const snapshots: ModeloPropostaSnapshot[] = [];
    for (const escolha of dto.modelos) {
      const antigo = anterior?.modelos.find(m => m.templateId === escolha.templateId && m.versaoId === escolha.versaoId);
      if (antigo) { snapshots.push(antigo); continue; }
      const modelo = disponiveis.modelos.find(m => m.templateId === escolha.templateId && m.versaoId === escolha.versaoId);
      if (!modelo) throw new BadRequestException('Modelo indisponível ou versão alterada. Reabra a conferência dos documentos.');
      snapshots.push(modelo);
    }
    const permitidas = new Set(VARIAVEIS_DISPONIVEIS.map(v => v.chave));
    const valores: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(dto.valores)) {
      if (!permitidas.has(chave) || especiais.has(chave) || typeof valor !== 'string' || valor.length > 20000 || valor.includes('{{')) throw new BadRequestException(`Valor inválido: ${chave}.`);
      valores[chave] = valor.trim();
    }
    const automaticos = this.valoresAutomaticos(proposta);
    // Identity and totals always come from the producer, call and proposal records.
    for (const chave of ['produtor.nome', 'produtor.cpfCnpj', 'produtor.endereco', 'produtor.municipio', 'produtor.telefone', 'edital.numero', 'edital.ano', 'projeto.valorTotal']) {
      if (automaticos[chave]) valores[chave] = automaticos[chave];
    }
    const config: ConfigDocumentos = { modelos: snapshots, valores, salvoEm: new Date().toISOString(), salvoPor: user?.sub };
    await this.prisma.proposta.update({ where: { id }, data: { documentosJson: JSON.stringify(config), status: 'RASCUNHO', arquivoPdfPath: null, arquivoDocxPath: null, updatedBy: user?.sub } });
    await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'UPDATE_DOCUMENTS', entity: 'Proposta', entityId: id,
      metadata: { executorId: user?.sub, fornecedorRepresentadoId: proposta.produtorId } });
    return { ...config, pendencias: validarDocumentos(snapshots, valores) };
  }

  async gerar(id: string, user?: AuthenticatedUser) {
    const proposta = await this.carregar(id, user);
    if (user && user.role !== 'ADMIN' && proposta.produtorId) await this.policy.requireProdutorAction(user, proposta.produtorId, 'EDITAR_PROPOSTA');
    if (['FINALIZADA', 'CANCELADA'].includes(proposta.status)) throw new BadRequestException('Proposta finalizada ou cancelada não pode ser regerada.');
    const config = this.config(proposta.documentosJson);
    if (!config) throw new BadRequestException('Abra Anexos e declarações, selecione os modelos da DRE e confira os dados antes de gerar.');
    const valores = { ...config.valores };
    const automaticos = this.valoresAutomaticos(proposta);
    for (const chave of ['produtor.nome', 'produtor.cpfCnpj', 'produtor.endereco', 'produtor.municipio', 'produtor.telefone', 'edital.numero', 'edital.ano', 'projeto.valorTotal']) valores[chave] = automaticos[chave] || valores[chave] || '';
    const erros = validarDocumentos(config.modelos, valores);
    if (!proposta.produtor || !proposta.itens.length) erros.push('Vincule um produtor e os itens ao projeto.');
    for (const item of proposta.itens) {
      if (Number(item.quantidade) <= 0 || Number(item.precoUnitario) <= 0 || !item.unidade) erros.push(`Confira quantidade, unidade e preço do produto ${item.produto}.`);
    }
    if (erros.length) throw new BadRequestException(erros);
    // Empty optional fields are explicit blanks; never emit unresolved tokens in a final document.
    const secoes = config.modelos.map((m, ordem) => ({ ...m, titulo: `${m.titulo} · v${m.numero}`, ordem, conteudo: m.conteudo.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (token, chave: string) => especiais.has(chave) ? token : (valores[chave] || '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) }));
    const input: DocumentoRenderInput = {
      numero: proposta.edital.numero, ano: proposta.edital.ano, titulo: `Projeto de venda — ${proposta.produtor!.nome}`,
      versao: 1, usuario: user?.sub || config.salvoPor || 'extensionista', geradoEm: new Date().toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' }),
      valores, secoes, separarSecoes: true,
      itens: this.itensTabela(proposta),
      escolas: proposta.edital.escolasVinculadas.map(e => e.escola.nome), fornecedores: [proposta.produtor!.nome],
    };
    const base = path.resolve(process.cwd(), 'storage', 'propostas', id, randomUUID());
    const pdfPath = await renderPdf(input, `${base}.pdf`);
    const docxPath = await renderDocx(input, `${base}.docx`);
    await this.prisma.proposta.update({ where: { id }, data: {
      status: 'GERADA', arquivoPdfPath: pdfPath, arquivoDocxPath: docxPath,
      documentosJson: JSON.stringify({ ...config, valores, geradoEm: new Date().toISOString() }), updatedBy: user?.sub,
    } });
    await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'GENERATE_DOCUMENTS', entity: 'Proposta', entityId: id,
      metadata: { executorId: user?.sub, fornecedorRepresentadoId: proposta.produtorId } });
    return { pdfPath, docxPath };
  }

  async previa(id: string, user?: AuthenticatedUser) {
    const proposta = await this.carregar(id, user);
    const config = this.config(proposta.documentosJson);
    if (!config) throw new BadRequestException('Salve a seleção dos documentos primeiro.');
    const valores = { ...this.valoresAutomaticos(proposta), ...config.valores };
    return {
      pendencias: validarDocumentos(config.modelos, valores),
      documentos: config.modelos.map(m => ({ titulo: m.titulo, versao: m.numero, texto: htmlParaTexto(m.conteudo).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_token, chave: string) => {
        if (chave === 'itens') return this.itensTabela(proposta).map(l => l.colunas.join(' | ')).join('\n');
        return valores[chave] || (camposDosModelos([m]).find(c => c.chave === chave)?.obrigatorio ? `[PENDENTE: ${catalogoPorChave(chave)?.rotulo || chave}]` : '—');
      }) })),
    };
  }

  private itensTabela(proposta: Awaited<ReturnType<PropostaDocumentosService['carregar']>>) {
    return [{ colunas: ['Produto / especificação', 'Unidade', 'Quantidade', 'Preço unitário', 'Total'] },
      ...proposta.itens.map(i => ({ colunas: [i.produto + (i.especificacao ? ` — ${i.especificacao}` : ''), i.unidade || '', String(i.quantidade || ''), dinheiro(Number(i.precoUnitario)), dinheiro(Number(i.quantidade) * Number(i.precoUnitario))] }))];
  }

  private valoresAutomaticos(p: Awaited<ReturnType<PropostaDocumentosService['carregar']>>): Record<string, string> {
    const produtor = p.produtor;
    const edital = p.edital;
    const valores: Record<string, string> = Object.fromEntries((edital.documento?.variaveis || []).filter(v => !v.escopo && !especiais.has(v.chave) && v.statusRevisao === 'confirmado' && v.valor).map(v => [v.chave, v.valor!]));
    const escola = edital.escola || edital.escolasVinculadas[0]?.escola;
    return { ...valores, ...(produtor?.dadosDocumentais as Record<string, string> || {}),
      'edital.numero': edital.numero, 'edital.ano': String(edital.ano), 'edital.titulo': edital.titulo,
      'edital.municipio.nome': edital.municipio?.nome || '', 'edital.municipio.uf': edital.municipio?.uf || 'MT',
      'edital.dataPublicacao': edital.dataPublicacao?.toLocaleDateString('pt-BR', { timeZone: 'America/Cuiaba' }) || '',
      'produtor.nome': produtor?.nome || '', 'produtor.cpfCnpj': produtor?.cpfCnpj || '',
      'produtor.endereco': produtor?.endereco || '', 'produtor.telefone': produtor?.telefone || '',
      'produtor.municipio': produtor ? `${produtor.municipio.nome}/${produtor.municipio.uf}` : '',
      'entidade.nome': valores['entidade.nome'] || escola?.nome || '',
      'entidade.cnpj': valores['entidade.cnpj'] || '',
      'entidade.endereco': valores['entidade.endereco'] || escola?.endereco || '',
      'entidade.municipio': valores['entidade.municipio'] || (edital.municipio ? `${edital.municipio.nome}/${edital.municipio.uf}` : ''),
      'entidade.telefone': valores['entidade.telefone'] || escola?.telefone || '',
      'projeto.local': produtor?.municipio.nome || '',
      'projeto.data': new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Cuiaba' }),
      'projeto.cronograma': valores['edital.regrasEntrega'] || '',
      'projeto.valorTotal': dinheiro(p.itens.reduce((sum, i) => sum + Number(i.quantidade) * Number(i.precoUnitario), 0)),
    };
  }
}

function dinheiro(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

