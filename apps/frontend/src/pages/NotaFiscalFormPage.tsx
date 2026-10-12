import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Divider, FormControl,
  IconButton, InputLabel, MenuItem, Select, Stack, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { ArrowBack, Add, Delete, UploadFile } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';
import { chaveAcessoValida, somaItensManuais, valorTotalItemManual, valorTotalNotaManual } from '../lib/fiscal-manual-ui';

type Contrato = { id: string; numero: string; exercicio: number; produtor?: { nome: string } };
type Fornecedor = { id: string; nome: string; cpfCnpj: string };
type ItemContrato = { id: string; produto: string; unidade?: string | null; valorUnitario: string };

type ItemManual = {
  descricao: string;
  unidadeComercial: string;
  quantidade: string;
  valorUnitario: string;
  contratoItemId: string;
};

const erroApi = (error: unknown) => {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const mensagem = e.response?.data?.message;
  return Array.isArray(mensagem) ? mensagem.join('; ') : mensagem || e.message || 'Falha na operação.';
};

const DECIMAL_ITEM = /^\d+(\.\d{1,4})?$/;
const DECIMAL_VALOR = /^\d+(\.\d{1,2})?$/;

const itemVazio = (): ItemManual => ({
  descricao: '',
  unidadeComercial: 'KG',
  quantidade: '',
  valorUnitario: '',
  contratoItemId: '',
});

export default function NotaFiscalFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [modo, setModo] = useState<'UPLOAD' | 'MANUAL'>('UPLOAD');

  // Upload de documento
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tipo, setTipo] = useState<'XML' | 'PDF'>('XML');

  // Contrato e fornecedor (comum aos dois modos)
  const [contratoId, setContratoId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itensContrato, setItensContrato] = useState<ItemContrato[]>([]);

  // Cadastro manual
  const [numero, setNumero] = useState('');
  const [serie, setSerie] = useState('');
  const [modelo, setModelo] = useState('55');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');
  const [cnpjEmitente, setCnpjEmitente] = useState('');
  const [documentoDestinatario, setDocumentoDestinatario] = useState('');
  const [valorDesconto, setValorDesconto] = useState('0.00');
  const [valorFrete, setValorFrete] = useState('0.00');
  const [valorOutrasDespesas, setValorOutrasDespesas] = useState('0.00');
  const [itens, setItens] = useState<ItemManual[]>([itemVazio()]);

  const carregar = async () => {
    setLoading(true); setErro('');
    try {
      const [c, f] = await Promise.all([
        api.get<ApiResponse<PaginationResponse<Contrato>>>('/contratos?status=VIGENTE&limit=100'),
        api.get<ApiResponse<PaginationResponse<Fornecedor>>>('/produtores?limit=100'),
      ]);
      setContratos(c.data.data.items);
      setFornecedores(f.data.data.items);
    } catch (e) { setErro(erroApi(e)); } finally { setLoading(false); }
  };

  useState(() => { void carregar(); });

  const selecionarContrato = async (id: string) => {
    setContratoId(id);
    setItensContrato([]);
    if (!id) return;
    try {
      const { data } = await api.get<ApiResponse<{ itens?: ItemContrato[] }>>(`/contratos/${id}`);
      setItensContrato(data.data?.itens ?? []);
    } catch { setItensContrato([]); }
  };

  const alterarItem = (indice: number, campo: keyof ItemManual, valor: string) => {
    setItens(prev => prev.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)));
  };

  const preencherDoContrato = (indice: number, contratoItemId: string) => {
    const itemContrato = itensContrato.find(c => c.id === contratoItemId);
    setItens(prev => prev.map((item, i) => (
      i === indice
        ? {
            ...item,
            contratoItemId,
            descricao: item.descricao || itemContrato?.produto || '',
            unidadeComercial: itemContrato?.unidade || item.unidadeComercial,
            valorUnitario: itemContrato?.valorUnitario || item.valorUnitario,
          }
        : item
    )));
  };

  const valorTotalItem = (item: ItemManual) => valorTotalItemManual(item.quantidade, item.valorUnitario);

  const somaItens = somaItensManuais(itens);
  const totalGeral = Number(valorTotalNotaManual(somaItens, valorDesconto, valorFrete, valorOutrasDespesas));

  const enviarUpload = async () => {
    if (!arquivo) { setErro('Selecione um arquivo XML ou PDF.'); return; }
    if (!contratoId) { setErro('Selecione um contrato.'); return; }
    if (!fornecedorId) { setErro('Selecione um fornecedor.'); return; }

    setLoading(true); setErro(''); setAviso('');
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('tipo', tipo);
      formData.append('contratoId', contratoId);
      formData.append('fornecedorId', fornecedorId);
      formData.append('observacoes', observacoes);

      const { data } = await api.post<ApiResponse<{ id: string }>>('/notas-fiscais/upload', formData);
      setAviso('Nota fiscal enviada com sucesso!');
      setTimeout(() => navigate(`/notas-fiscais/${data.data.id}`), 1500);
    } catch (e) { setErro(erroApi(e)); } finally { setLoading(false); }
  };

  const enviarManual = async () => {
    if (!contratoId) { setErro('Selecione um contrato.'); return; }
    if (!fornecedorId) { setErro('Selecione um fornecedor.'); return; }
    if (!numero.trim()) { setErro('Informe o número da nota fiscal.'); return; }
    if (!dataEmissao) { setErro('Informe a data de emissão.'); return; }
    if (!chaveAcessoValida(chaveAcesso)) { setErro('A chave de acesso deve conter 44 dígitos.'); return; }
    if (itens.length === 0) { setErro('Informe ao menos um item.'); return; }
    for (const [i, item] of itens.entries()) {
      if (!item.descricao.trim()) { setErro(`Informe a descrição do item ${i + 1}.`); return; }
      if (!DECIMAL_ITEM.test(item.quantidade) || Number(item.quantidade) <= 0) { setErro(`Quantidade inválida no item ${i + 1}.`); return; }
      if (!DECIMAL_VALOR.test(item.valorUnitario)) { setErro(`Valor unitário inválido no item ${i + 1}.`); return; }
    }

    setLoading(true); setErro(''); setAviso('');
    try {
      const payload = {
        contratoId,
        fornecedorId,
        numero: numero.trim(),
        serie: serie.trim() || undefined,
        modelo: modelo.trim() || undefined,
        chaveAcesso: chaveAcesso.trim() || undefined,
        dataEmissao: new Date(dataEmissao).toISOString(),
        cnpjEmitente: cnpjEmitente.trim() || undefined,
        documentoDestinatario: documentoDestinatario.trim() || undefined,
        valorProdutos: somaItens,
        valorTotal: valorTotalNotaManual(somaItens, valorDesconto, valorFrete, valorOutrasDespesas),
        valorDesconto: valorDesconto || '0.00',
        valorFrete: valorFrete || '0.00',
        valorOutrasDespesas: valorOutrasDespesas || '0.00',
        observacoes: observacoes.trim() || undefined,
        itens: itens.map((item, i) => ({
          numeroItem: i + 1,
          descricao: item.descricao.trim(),
          unidadeComercial: item.unidadeComercial.trim() || undefined,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorTotal: valorTotalItem(item),
          contratoItemId: item.contratoItemId || undefined,
        })),
      };
      const { data } = await api.post<ApiResponse<{ id: string }>>('/notas-fiscais', payload);
      setAviso('Nota fiscal cadastrada manualmente!');
      setTimeout(() => navigate(`/notas-fiscais/${data.data.id}`), 1500);
    } catch (e) { setErro(erroApi(e)); } finally { setLoading(false); }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/notas-fiscais')}>
          Voltar
        </Button>
        <Typography variant="h5">Nova Nota Fiscal</Typography>
      </Stack>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
      {aviso && <Alert severity="success" sx={{ mb: 2 }}>{aviso}</Alert>}

      <Tabs value={modo} onChange={(_, v) => setModo(v)} sx={{ mb: 2 }}>
        <Tab value="UPLOAD" label="Upload de documento" />
        <Tab value="MANUAL" label="Cadastro manual" />
      </Tabs>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            {modo === 'UPLOAD' ? (
              <>
                <Typography variant="subtitle1" fontWeight="bold">Upload de Documento Fiscal</Typography>

                <FormControl fullWidth>
                  <InputLabel>Tipo de Documento</InputLabel>
                  <Select value={tipo} label="Tipo de Documento" onChange={e => setTipo(e.target.value as 'XML' | 'PDF')}>
                    <MenuItem value="XML">XML (NF-e)</MenuItem>
                    <MenuItem value="PDF">PDF da nota fiscal</MenuItem>
                  </Select>
                </FormControl>

                <Button variant="outlined" component="label" startIcon={<UploadFile />}>
                  Selecionar {tipo === 'XML' ? 'XML' : 'PDF'}
                  <input
                    type="file"
                    hidden
                    accept={tipo === 'XML' ? '.xml,application/xml' : '.pdf,application/pdf'}
                    onChange={e => setArquivo(e.target.files?.[0] || null)}
                  />
                </Button>

                {arquivo && (
                  <Typography variant="body2">
                    Arquivo: {arquivo.name} ({(arquivo.size / 1024).toFixed(1)} KB)
                  </Typography>
                )}

                <Divider />
              </>
            ) : (
              <>
                <Alert severity="info">
                  Operação administrativa: o cadastro é feito manualmente pela equipe fiscal. Nenhum sistema
                  externo (SEFAZ, bancos, APIs de pagamento) é consultado — o XML/PDF serve apenas como apoio
                  de preenchimento, e os dados são conferidos antes da confirmação.
                </Alert>

                <Typography variant="subtitle1" fontWeight="bold">Dados da Nota Fiscal</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Número" value={numero} onChange={e => setNumero(e.target.value)} required />
                  <TextField label="Série" value={serie} onChange={e => setSerie(e.target.value)} sx={{ maxWidth: 120 }} />
                  <TextField label="Modelo" value={modelo} onChange={e => setModelo(e.target.value)} sx={{ maxWidth: 120 }} />
                  <TextField
                    label="Data de Emissão"
                    type="date"
                    value={dataEmissao}
                    onChange={e => setDataEmissao(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Stack>

                <TextField
                  label="Chave de acesso (opcional — 44 dígitos)"
                  value={chaveAcesso}
                  onChange={e => setChaveAcesso(e.target.value.replace(/\D/g, ''))}
                  inputProps={{ maxLength: 44 }}
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="CNPJ/CPF do emitente" value={cnpjEmitente} onChange={e => setCnpjEmitente(e.target.value)} />
                  <TextField label="Documento do destinatário" value={documentoDestinatario} onChange={e => setDocumentoDestinatario(e.target.value)} />
                </Stack>

                <Divider />
                <Typography variant="subtitle1" fontWeight="bold">Itens</Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Item contratual (opcional)</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Unidade</TableCell>
                        <TableCell align="right">Quantidade</TableCell>
                        <TableCell align="right">Valor Unitário</TableCell>
                        <TableCell align="right">Valor Total</TableCell>
                        <TableCell align="right">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {itens.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              displayEmpty
                              value={item.contratoItemId}
                              onChange={e => preencherDoContrato(i, e.target.value)}
                              sx={{ minWidth: 180 }}
                            >
                              <MenuItem value=""><em>Vincular depois</em></MenuItem>
                              {itensContrato.map(ic => (
                                <MenuItem key={ic.id} value={ic.id}>{ic.produto}</MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={item.descricao} onChange={e => alterarItem(i, 'descricao', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={item.unidadeComercial} onChange={e => alterarItem(i, 'unidadeComercial', e.target.value)} sx={{ width: 80 }} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              value={item.quantidade}
                              onChange={e => alterarItem(i, 'quantidade', e.target.value)}
                              sx={{ width: 110 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              value={item.valorUnitario}
                              onChange={e => alterarItem(i, 'valorUnitario', e.target.value)}
                              sx={{ width: 110 }}
                            />
                          </TableCell>
                          <TableCell align="right">{moedaSimples(valorTotalItem(item))}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => setItens(prev => prev.filter((_, j) => j !== i))} disabled={itens.length === 1}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Button size="small" startIcon={<Add />} onClick={() => setItens(prev => [...prev, itemVazio()])}>
                  Adicionar item
                </Button>

                <Divider />
                <Typography variant="subtitle1" fontWeight="bold">Valores</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Desconto" value={valorDesconto} onChange={e => setValorDesconto(e.target.value)} sx={{ maxWidth: 160 }} />
                  <TextField label="Frete" value={valorFrete} onChange={e => setValorFrete(e.target.value)} sx={{ maxWidth: 160 }} />
                  <TextField label="Outras despesas" value={valorOutrasDespesas} onChange={e => setValorOutrasDespesas(e.target.value)} sx={{ maxWidth: 160 }} />
                  <TextField label="Valor dos produtos (calculado)" value={somaItens} InputProps={{ readOnly: true }} sx={{ maxWidth: 220 }} />
                  <TextField label="Valor total (calculado)" value={totalGeral.toFixed(2)} InputProps={{ readOnly: true }} sx={{ maxWidth: 200 }} />
                </Stack>
              </>
            )}

            <FormControl fullWidth>
              <InputLabel>Contrato</InputLabel>
              <Select value={contratoId} label="Contrato" onChange={e => void selecionarContrato(e.target.value)}>
                {contratos.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.numero}/{c.exercicio} - {c.produtor?.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Fornecedor</InputLabel>
              <Select value={fornecedorId} label="Fornecedor" onChange={e => setFornecedorId(e.target.value)}>
                {fornecedores.map(f => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nome} - {f.cpfCnpj}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Observações"
              multiline
              rows={3}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
            />

            <Box>
              <Button variant="contained" onClick={modo === 'UPLOAD' ? enviarUpload : enviarManual} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : modo === 'UPLOAD' ? 'Enviar Nota Fiscal' : 'Cadastrar Nota Fiscal'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

function moedaSimples(valor: string | number) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
