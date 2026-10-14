import type { Request, Response } from 'express';
import { NotaFiscalService } from '../../application/services/nota-fiscal.service';
import { FiscalDocumentoService } from '../../application/services/fiscal-documento.service';
import { ConferenciaFiscalService } from '../../application/services/conferencia-fiscal.service';
import { AtestoService } from '../../application/services/atesto.service';
import { AtualizarNotaFiscalDto, CriarAtestoDto, CriarNotaFiscalDto, FiltrosNotaFiscalDto, RegistrarConferenciaDto, UploadNotaFiscalDto, VincularRecebimentoDto } from '../dto/fiscal.dto';
export declare class NotaFiscalController {
    private readonly service;
    private readonly documentoService;
    private readonly conferenciaService;
    private readonly atestoService;
    constructor(service: NotaFiscalService, documentoService: FiscalDocumentoService, conferenciaService: ConferenciaFiscalService, atestoService: AtestoService);
    findAll(query: FiltrosNotaFiscalDto, req: Request): Promise<{
        items: import("../../application/services/fiscal-presenter").NotaFiscalListItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    criar(dto: CriarNotaFiscalDto, req: Request): Promise<import("../../application/services/fiscal-presenter").NotaFiscalDetail>;
    atualizar(id: string, dto: AtualizarNotaFiscalDto, req: Request): Promise<import("../../application/services/fiscal-presenter").NotaFiscalDetail>;
    recebimentosCandidatos(id: string, req: Request): Promise<{
        itens: {
            id: string;
            numeroItem: number;
            descricao: string;
            quantidade: string;
            valorUnitario: string;
            contratoItemId: string | null;
            quantidadeVinculada: string;
            quantidadeDisponivel: string;
        }[];
        recebimentos: {
            entregaItemId: string;
            entregaId: string;
            entregaNumero: string;
            entregaStatus: import(".prisma/client").$Enums.StatusEntrega;
            dataEntrega: Date;
            produto: string;
            unidadeMedida: string | null;
            contratoItemId: string;
            quantidadeAceita: string;
            quantidadeVinculada: string;
            quantidadeDisponivel: string;
        }[];
    }>;
    vincularRecebimento(id: string, dto: VincularRecebimentoDto, req: Request): Promise<import("../../application/services/fiscal-presenter").NotaFiscalDetail>;
    desvincularRecebimento(id: string, vinculoId: string, req: Request): Promise<import("../../application/services/fiscal-presenter").NotaFiscalDetail>;
    upload(arquivo: Express.Multer.File, dto: UploadNotaFiscalDto, req: Request): Promise<{
        id: string;
    }>;
    findOne(id: string, req: Request): Promise<import("../../application/services/fiscal-presenter").NotaFiscalDetail>;
    conciliar(id: string, req: Request): Promise<{
        id: string;
        numero: string;
        status: import(".prisma/client").$Enums.StatusNotaFiscal;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        valorTotal: import("@prisma/client/runtime/library").Decimal;
        dataRecebimento: Date;
        contratoId: string;
        fornecedorId: string;
        serie: string | null;
        modelo: string | null;
        chaveAcesso: string | null;
        dataEmissao: Date;
        cnpjEmitente: string | null;
        cpfEmitente: string | null;
        documentoDestinatario: string | null;
        valorProdutos: import("@prisma/client/runtime/library").Decimal;
        valorDesconto: import("@prisma/client/runtime/library").Decimal;
        valorFrete: import("@prisma/client/runtime/library").Decimal;
        valorOutrasDespesas: import("@prisma/client/runtime/library").Decimal;
        resultadoConciliacao: import(".prisma/client").$Enums.ResultadoConciliacaoFiscal | null;
        xmlDocumentoId: string | null;
        pdfDocumentoId: string | null;
    }>;
    download(id: string, documentoId: string, req: Request, res: Response): Promise<void>;
    obterConferencia(id: string, req: Request): Promise<import("../../application/services/conferencia-fiscal.service").ConferenciaResponse | null>;
    registrarConferencia(id: string, dto: RegistrarConferenciaDto, req: Request): Promise<import("../../application/services/conferencia-fiscal.service").ConferenciaResponse>;
    listarAtestos(id: string, req: Request): Promise<import("../../application/services/atesto.service").AtestoResponse[]>;
    criarAtesto(id: string, comprovante: Express.Multer.File | undefined, dto: CriarAtestoDto, req: Request): Promise<import("../../application/services/atesto.service").AtestoResponse>;
    comprovanteAtesto(id: string, atestoId: string, req: Request, res: Response): Promise<void>;
}
