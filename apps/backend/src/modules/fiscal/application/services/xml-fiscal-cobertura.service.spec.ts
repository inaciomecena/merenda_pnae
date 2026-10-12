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

describe('SDD-005: XML fiscal (ramificações de formatos alternativos)', () => {
  it('extrai NFe com CPF, item único sem nItem, dEmi e totais explícitos', async () => {
    const xml = Buffer.from(
      `<NFe><infNFe Id="NFe${chave()}"><ide><nNF>7</nNF><serie>2</serie><mod>55</mod><dEmi>2026-05-01</dEmi></ide>` +
        `<emit><CPF>12345678901</CPF><xNome>Produtor</xNome></emit><dest><CPF>98765432100</CPF></dest>` +
        `<det><prod><cProd>B</cProd><xProd>Feijão</xProd><uCom>SC</uCom><qCom>2.0000</qCom><vUnCom>30.0000</vUnCom><vProd>60.00</vProd></prod></det>` +
        `<total><ICMSTot><vProd>60.00</vProd><vDesc>2.00</vDesc><vFrete>1.00</vFrete><vOutro>0.50</vOutro><vNF>59.50</vNF></ICMSTot></total></infNFe></NFe>`,
    );

    const dados = await service.extrairDadosNFe(xml);

    expect(dados.cpfEmitente).toBe('12345678901');
    expect(dados.cnpjEmitente).toBeUndefined();
    expect(dados.cpfDestinatario).toBe('98765432100');
    expect(dados.cnpjDestinatario).toBeUndefined();
    expect(dados.nomeEmitente).toBe('Produtor');
    expect(dados.itens).toHaveLength(1);
    expect(dados.itens[0]).toEqual(
      expect.objectContaining({
        numeroItem: 1,
        descricao: 'Feijão',
        unidade: 'SC',
        quantidade: '2.0000',
        ncm: undefined,
        cfop: undefined,
      }),
    );
    expect(dados.valorDesconto).toBe('2.00');
    expect(dados.valorFrete).toBe('1.00');
    expect(dados.valorOutrasDespesas).toBe('0.50');
    expect(dados.dataEmissao.getFullYear()).toBe(2026);
  });

  it('item sem quantidade positiva é rejeitado mesmo com XML válido', async () => {
    const xml = Buffer.from(
      `<NFe><infNFe Id="NFe${chave()}"><ide><nNF>7</nNF><serie>2</serie><mod>55</mod><dEmi>2026-05-01</dEmi></ide>` +
        `<emit><CNPJ>12345678000195</CNPJ><xNome>Fornecedor</xNome></emit><dest><CNPJ>12345678000195</CNPJ></dest>` +
        `<det nItem="1"><prod><cProd>B</cProd><xProd>Feijão</xProd><uCom>SC</uCom><qCom>0</qCom><vUnCom>30.0000</vUnCom><vProd>0.00</vProd></prod></det>` +
        `<total><ICMSTot><vProd>0.00</vProd><vNF>0.00</vNF></ICMSTot></total></infNFe></NFe>`,
    );

    await expect(service.extrairDadosNFe(xml)).rejects.toThrow('positiva');
  });

  it('lê a chave de acesso da tag chNFe do protocolo', async () => {
    const protocolo = Buffer.from(
      `<protNFe><infProt><chNFe>${chave()}</chNFe></infProt></protNFe>`,
    );

    await expect(service.extrairChaveAcessoRapido(protocolo)).resolves.toBe(chave());
  });

  it('leitura rápida devolve null quando o buffer é inválido (capture interno)', async () => {
    await expect(service.extrairChaveAcessoRapido(Buffer.alloc(0))).resolves.toBeNull();
    await expect(
      service.extrairChaveAcessoRapido(Buffer.from('<!DOCTYPE foo><NFe/>')),
    ).resolves.toBeNull();
  });
});
