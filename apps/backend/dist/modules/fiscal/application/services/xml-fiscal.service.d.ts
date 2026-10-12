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
export declare class XmlFiscalService {
    private decimal;
    private conferirBuffer;
    extrairDadosNFe(xmlBuffer: Buffer): Promise<DadosNFe>;
    validarXmlNFe(xmlBuffer: Buffer): Promise<boolean>;
    validarChaveAcesso(chave: string): boolean;
    extrairChaveAcessoRapido(xmlBuffer: Buffer): Promise<string | null>;
}
