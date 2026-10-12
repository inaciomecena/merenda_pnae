import { BadRequestException, Injectable } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';

// Keep amounts as decimal strings; consumers must use Prisma.Decimal.
export interface ItemNFe {
  numeroItem: number;
  codigoProduto: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  valorTotal: string;
}

export interface DadosNFe {
  numero: string;
  serie: string;
  modelo: string;
  chaveAcesso: string;
  dataEmissao: Date;
  cnpjEmitente?: string;
  cpfEmitente?: string;
  nomeEmitente: string;
  cnpjDestinatario?: string;
  cpfDestinatario?: string;
  valorProdutos: string;
  valorTotal: string;
  valorDesconto: string;
  valorFrete: string;
  valorOutrasDespesas: string;
  itens: ItemNFe[];
}

@Injectable()
export class XmlFiscalService {
  private decimal(valor: unknown, campo: string): string {
    const texto = String(valor ?? '').trim();
    if (!/^(0|[1-9]\d{0,13})(\.\d{1,10})?$/.test(texto)) {
      throw new BadRequestException(`${campo} inválido no XML da NF-e.`);
    }
    return texto;
  }

  private conferirBuffer(xmlBuffer: Buffer): string {
    if (!Buffer.isBuffer(xmlBuffer) || xmlBuffer.length === 0 || xmlBuffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('XML vazio ou acima do limite de 10 MB.');
    }
    const xml = xmlBuffer.toString('utf8').replace(/^\uFEFF/, '').trim();
    if (!xml.startsWith('<') || /<!DOCTYPE|<!ENTITY/i.test(xml)) {
      throw new BadRequestException('XML fiscal inválido ou com entidades externas.');
    }
    return xml;
  }

  async extrairDadosNFe(xmlBuffer: Buffer): Promise<DadosNFe> {
    const xml = this.conferirBuffer(xmlBuffer);
    let parsed: any;
    try {
      parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false, mergeAttrs: true, strict: true });
    } catch {
      throw new BadRequestException('XML fiscal malformado.');
    }
    const inf = parsed.nfeProc?.NFe?.infNFe ?? parsed.NFe?.infNFe;
    if (!inf?.ide || !inf?.emit || !inf?.dest || !inf?.total?.ICMSTot) {
      throw new BadRequestException('Estrutura obrigatória da NF-e ausente.');
    }
    const { ide, emit, dest } = inf;
    const total = inf.total.ICMSTot;
    const chaveAcesso = String(inf.Id ?? '').replace(/^NFe/, '');
    if (!this.validarChaveAcesso(chaveAcesso)) {
      throw new BadRequestException('Chave de acesso da NF-e inválida.');
    }
    const dataEmissao = new Date(ide.dhEmi ?? ide.dEmi ?? '');
    if (Number.isNaN(dataEmissao.getTime())) throw new BadRequestException('Data de emissão inválida.');
    const detalhes = Array.isArray(inf.det) ? inf.det : inf.det ? [inf.det] : [];
    if (!detalhes.length) throw new BadRequestException('NF-e sem itens.');
    const itens = detalhes.map((det: any, index: number): ItemNFe => {
      const prod = det?.prod;
      if (!prod?.xProd || !prod?.uCom) throw new BadRequestException(`Item ${index + 1} incompleto.`);
      const quantidade = this.decimal(prod.qCom, `Quantidade do item ${index + 1}`);
      if (!Number(quantidade)) throw new BadRequestException(`Quantidade do item ${index + 1} deve ser positiva.`);
      return {
        numeroItem: Number(det.nItem) || index + 1,
        codigoProduto: String(prod.cProd ?? ''),
        descricao: String(prod.xProd),
        ncm: prod.NCM ? String(prod.NCM) : undefined,
        cfop: prod.CFOP ? String(prod.CFOP) : undefined,
        unidade: String(prod.uCom),
        quantidade,
        valorUnitario: this.decimal(prod.vUnCom, `Valor unitário do item ${index + 1}`),
        valorTotal: this.decimal(prod.vProd, `Valor do item ${index + 1}`),
      };
    });
    return {
      numero: String(ide.nNF ?? ''), serie: String(ide.serie ?? ''), modelo: String(ide.mod ?? ''),
      chaveAcesso, dataEmissao,
      cnpjEmitente: emit.CNPJ ? String(emit.CNPJ) : undefined,
      cpfEmitente: emit.CPF ? String(emit.CPF) : undefined,
      nomeEmitente: String(emit.xNome ?? ''),
      cnpjDestinatario: dest.CNPJ ? String(dest.CNPJ) : undefined,
      cpfDestinatario: dest.CPF ? String(dest.CPF) : undefined,
      valorProdutos: this.decimal(total.vProd, 'Valor dos produtos'),
      valorTotal: this.decimal(total.vNF, 'Valor total'),
      valorDesconto: this.decimal(total.vDesc ?? '0', 'Desconto'),
      valorFrete: this.decimal(total.vFrete ?? '0', 'Frete'),
      valorOutrasDespesas: this.decimal(total.vOutro ?? '0', 'Outras despesas'), itens,
    };
  }

  async validarXmlNFe(xmlBuffer: Buffer): Promise<boolean> {
    try { await this.extrairDadosNFe(xmlBuffer); return true; } catch { return false; }
  }

  validarChaveAcesso(chave: string): boolean {
    if (!/^\d{44}$/.test(chave) || !['55', '65'].includes(chave.slice(20, 22))) return false;
    let soma = 0;
    let peso = 2;
    for (let i = 42; i >= 0; i--) {
      soma += Number(chave[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    return Number(chave[43]) === (resto < 2 ? 0 : 11 - resto);
  }

  async extrairChaveAcessoRapido(xmlBuffer: Buffer): Promise<string | null> {
    try {
      const xml = this.conferirBuffer(xmlBuffer);
      const chave = xml.match(/\bId=["']NFe(\d{44})["']/)?.[1] ?? xml.match(/<chNFe>(\d{44})<\/chNFe>/)?.[1];
      return chave && this.validarChaveAcesso(chave) ? chave : null;
    } catch { return null; }
  }
}
