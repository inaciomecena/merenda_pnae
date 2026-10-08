export interface PropostaPdfData {
    numeroProposta: string;
    tipoDocumento: string;
    edital: {
        numero: string;
        ano: number;
        titulo: string;
        objeto?: string;
        municipio?: {
            nome: string;
            uf: string;
        };
    };
    produtor: {
        nome: string;
        cpfCnpj?: string;
        telefone?: string;
        endereco?: string;
        municipio?: {
            nome: string;
            uf: string;
        };
        email?: string;
    };
    itens: Array<{
        produto: string;
        especificacao?: string;
        marca?: string;
        quantidade?: number;
        unidade?: string;
        precoUnitario?: number;
        valorTotal?: number;
    }>;
    valorTotal: number;
    validadeDias: number;
    prazoEntrega: number;
    observacao?: string;
    dataGeracao: string;
}
export declare class PdfGeneratorService {
    generate(data: PropostaPdfData, outputPath: string): Promise<string>;
    private drawHeader;
    private drawEditalInfo;
    private drawProdutorInfo;
    private drawItensTable;
    private drawTotais;
    private drawConditions;
    private drawSignature;
    private drawLine;
}
