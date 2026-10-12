import type { Request, Response } from 'express';
import { LiquidacaoService } from '../../application/services/liquidacao.service';
import { CriarLiquidacaoDto, FiltrosLiquidacaoDto } from '../dto/fiscal.dto';
export declare class LiquidacaoController {
    private readonly service;
    constructor(service: LiquidacaoService);
    findAll(query: FiltrosLiquidacaoDto, req: Request): Promise<{
        items: import("../../application/services/liquidacao.service").LiquidacaoResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    criar(comprovante: Express.Multer.File | undefined, dto: CriarLiquidacaoDto, req: Request): Promise<import("../../application/services/liquidacao.service").LiquidacaoResponse>;
    comprovante(id: string, req: Request, res: Response): Promise<void>;
}
