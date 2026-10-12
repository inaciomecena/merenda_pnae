import type { Request, Response } from 'express';
import { PagamentoService } from '../../application/services/pagamento.service';
import { CriarPagamentoDto, EstornarPagamentoDto, FiltrosPagamentoDto } from '../dto/fiscal.dto';
export declare class PagamentoController {
    private readonly service;
    constructor(service: PagamentoService);
    findAll(query: FiltrosPagamentoDto, req: Request): Promise<{
        items: import("../../application/services/pagamento.service").PagamentoResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    criar(comprovante: Express.Multer.File | undefined, dto: CriarPagamentoDto, req: Request): Promise<import("../../application/services/pagamento.service").PagamentoResponse>;
    estornar(id: string, dto: EstornarPagamentoDto, req: Request): Promise<import("../../application/services/pagamento.service").PagamentoResponse>;
    comprovante(id: string, req: Request, res: Response): Promise<void>;
}
