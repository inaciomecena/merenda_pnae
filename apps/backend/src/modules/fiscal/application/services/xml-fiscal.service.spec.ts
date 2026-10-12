import { XmlFiscalService } from './xml-fiscal.service';

const service = new XmlFiscalService();

function chave(): string {
  const base = '5126101234567800019555001000000001100000000';
  let soma = 0;
  let peso = 2;
  for (let i = 42; i >= 0; i--) {
    soma += Number(base[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return base + (resto < 2 ? 0 : 11 - resto);
}

function xml(campos = ''): Buffer {
  return Buffer.from(`<NFe><infNFe Id="NFe${chave()}"><ide><nNF>1</nNF><serie>1</serie><mod>55</mod><dhEmi>2026-10-11T09:00:00-04:00</dhEmi></ide><emit><CNPJ>12345678000195</CNPJ><xNome>Fornecedor</xNome></emit><dest><CNPJ>12345678000195</CNPJ></dest><det nItem="1"><prod><cProd>A</cProd><xProd>Arroz</xProd><uCom>KG</uCom><qCom>1.2500</qCom><vUnCom>10.0000</vUnCom><vProd>12.50</vProd></prod></det><total><ICMSTot><vProd>12.50</vProd><vNF>12.50</vNF></ICMSTot></total>${campos}</infNFe></NFe>`);
}

describe('XmlFiscalService', () => {
  it('extrai dados sem converter decimais em ponto flutuante', async () => {
    const dados = await service.extrairDadosNFe(xml());
    expect(dados.chaveAcesso).toBe(chave());
    expect(dados.itens[0].quantidade).toBe('1.2500');
    expect(dados.itens[0].valorUnitario).toBe('10.0000');
    expect(dados.valorTotal).toBe('12.50');
  });

  it('rejeita chave com dígito verificador incorreto', async () => {
    const alterada = xml().toString().replace(chave(), chave().slice(0, 43) + (chave()[43] === '0' ? '1' : '0'));
    await expect(service.extrairDadosNFe(Buffer.from(alterada))).rejects.toThrow('Chave de acesso');
  });

  it('rejeita entidade externa, data inválida e quantidade negativa', async () => {
    await expect(service.extrairDadosNFe(Buffer.from('<!DOCTYPE foo><NFe/>'))).rejects.toThrow();
    await expect(service.extrairDadosNFe(Buffer.from(xml().toString().replace('2026-10-11T09:00:00-04:00', 'invalida')))).rejects.toThrow('Data de emissão');
    await expect(service.extrairDadosNFe(Buffer.from(xml().toString().replace('1.2500', '-1.2500')))).rejects.toThrow('Quantidade');
  });

  it('rejeita XML vazio, malformado, incompleto e sem itens', async () => {
    await expect(service.extrairDadosNFe(Buffer.alloc(0))).rejects.toThrow('vazio');
    await expect(service.extrairDadosNFe(Buffer.from('<NFe>'))).rejects.toThrow('malformado');
    await expect(service.extrairDadosNFe(Buffer.from('<NFe><infNFe/></NFe>'))).rejects.toThrow('Estrutura');
    await expect(service.extrairDadosNFe(Buffer.from(xml().toString().replace(/<det nItem="1">.*?<\/det>/, '')))).rejects.toThrow('sem itens');
  });

  it('rejeita valores não decimais e aceita NF-e em nfeProc', async () => {
    await expect(service.extrairDadosNFe(Buffer.from(xml().toString().replace('<vNF>12.50</vNF>', '<vNF>1e9</vNF>')))).rejects.toThrow('Valor total');
    const proc = Buffer.from(`<nfeProc>${xml().toString()}</nfeProc>`);
    expect((await service.extrairDadosNFe(proc)).numero).toBe('1');
    expect(await service.validarXmlNFe(proc)).toBe(true);
    expect(await service.validarXmlNFe(Buffer.from('<foo/>'))).toBe(false);
  });

  it('extrai chave rapidamente apenas quando o dígito verificador confere', async () => {
    expect(await service.extrairChaveAcessoRapido(xml())).toBe(chave());
    expect(await service.extrairChaveAcessoRapido(Buffer.from('<foo/>'))).toBeNull();
    expect(service.validarChaveAcesso(chave().slice(0, 43) + 'x')).toBe(false);
  });
});
