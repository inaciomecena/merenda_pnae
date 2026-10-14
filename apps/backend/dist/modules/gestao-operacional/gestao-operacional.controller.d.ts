import { Request } from 'express';
import { GestaoOperacionalService } from './gestao-operacional.service';
import { ConfiguracaoInstitucionalDto, ParametroOperacionalDto, NotificacaoDto, ChecklistDto, ChecklistItemDto, ChecklistStatusDto } from './gestao-operacional.dto';
export declare class GestaoOperacionalController {
    private readonly service;
    constructor(service: GestaoOperacionalService);
    private user;
    dashboardRaiz(req: Request): Promise<{
        indicadores: {
            editaisEmElaboracao: any;
            editaisPublicados: any;
            chamadasAbertas: any;
            inscricoesPendentes: any;
            contratosEmRascunho: any;
            entregasPendentes: any;
            prestacoesContasPendentes: any;
        };
        escopo: "ADMIN" | "DRE" | "ESCOLA" | "PRODUTOR" | "REPRESENTANTE" | "EXTENSIONISTA";
        atualizadoEm: string;
    }>;
    dashboard(req: Request): Promise<{
        indicadores: {
            editaisEmElaboracao: any;
            editaisPublicados: any;
            chamadasAbertas: any;
            inscricoesPendentes: any;
            contratosEmRascunho: any;
            entregasPendentes: any;
            prestacoesContasPendentes: any;
        };
        escopo: "ADMIN" | "DRE" | "ESCOLA" | "PRODUTOR" | "REPRESENTANTE" | "EXTENSIONISTA";
        atualizadoEm: string;
    }>;
    pendencias(req: Request): Promise<{
        items: {
            id: string;
            tipo: string;
            origem: string;
            quantidade: any;
            prioridade: string;
            situacao: string;
            link: string;
        }[];
        total: number;
        geradaEm: string;
    }>;
    configuracoes(req: Request): Promise<{
        valor: any;
        id: string;
        dreId: string | null;
        municipioId: string | null;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        escolaId: string | null;
        versao: number;
        tipo: string;
        ativo: boolean;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        chave: string;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        permiteSobrescrita: boolean;
        vigenteDesde: Date;
        vigenteAte: Date | null;
    }[]>;
    resolver(chave: string, dreId: string, escolaId: string, municipioId: string, req: Request): Promise<{
        chave: string;
        valor: any;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        versao: number;
        responsavelId: string | null;
    } | null>;
    criarConfiguracao(dto: ConfiguracaoInstitucionalDto, req: Request): Promise<{
        id: string;
        dreId: string | null;
        municipioId: string | null;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        escolaId: string | null;
        versao: number;
        tipo: string;
        ativo: boolean;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        chave: string;
        valor: string;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        permiteSobrescrita: boolean;
        vigenteDesde: Date;
        vigenteAte: Date | null;
    }>;
    atualizarConfiguracao(dto: ConfiguracaoInstitucionalDto, req: Request): Promise<{
        id: string;
        dreId: string | null;
        municipioId: string | null;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        escolaId: string | null;
        versao: number;
        tipo: string;
        ativo: boolean;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        chave: string;
        valor: string;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        permiteSobrescrita: boolean;
        vigenteDesde: Date;
        vigenteAte: Date | null;
    }>;
    parametros(req: Request): Promise<({
        versoes: {
            id: string;
            dreId: string | null;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusParametroOperacional;
            responsavelId: string | null;
            createdAt: Date;
            escolaId: string | null;
            justificativa: string | null;
            versao: number;
            valor: string;
            escopo: import(".prisma/client").$Enums.EscopoInstitucional;
            vigenteDesde: Date;
            vigenteAte: Date | null;
            fonteNormativa: string | null;
            parametroId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.StatusParametroOperacional;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        descricao: string;
        unidade: string | null;
        tipo: string;
        codigo: string;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        versaoAtual: number;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        vigenteDesde: Date | null;
        vigenteAte: Date | null;
        fonteNormativa: string | null;
        permiteAlteracao: boolean;
    })[]>;
    criarParametro(dto: ParametroOperacionalDto, req: Request): Promise<{
        versoes: {
            id: string;
            dreId: string | null;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusParametroOperacional;
            responsavelId: string | null;
            createdAt: Date;
            escolaId: string | null;
            justificativa: string | null;
            versao: number;
            valor: string;
            escopo: import(".prisma/client").$Enums.EscopoInstitucional;
            vigenteDesde: Date;
            vigenteAte: Date | null;
            fonteNormativa: string | null;
            parametroId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.StatusParametroOperacional;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        descricao: string;
        unidade: string | null;
        tipo: string;
        codigo: string;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        versaoAtual: number;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        vigenteDesde: Date | null;
        vigenteAte: Date | null;
        fonteNormativa: string | null;
        permiteAlteracao: boolean;
    }>;
    versionarParametro(id: string, dto: ParametroOperacionalDto, req: Request): Promise<{
        id: string;
        dreId: string | null;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusParametroOperacional;
        responsavelId: string | null;
        createdAt: Date;
        escolaId: string | null;
        justificativa: string | null;
        versao: number;
        valor: string;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        vigenteDesde: Date;
        vigenteAte: Date | null;
        fonteNormativa: string | null;
        parametroId: string;
    }>;
    notificacoes(page: string, limit: string, req: Request): Promise<{
        items: {
            id: string;
            dreId: string | null;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusNotificacaoInterna;
            titulo: string;
            escolaId: string | null;
            tipo: string;
            link: string | null;
            origem: string | null;
            userId: string;
            escopo: import(".prisma/client").$Enums.EscopoInstitucional;
            mensagem: string;
            referenciaTipo: string | null;
            referenciaId: string | null;
            dedupeKey: string;
            criadoEm: Date;
            lidaEm: Date | null;
        }[];
        total: number;
        unread: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    criarNotificacao(dto: NotificacaoDto, req: Request): Promise<{
        id: string;
        dreId: string | null;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusNotificacaoInterna;
        titulo: string;
        escolaId: string | null;
        tipo: string;
        link: string | null;
        origem: string | null;
        userId: string;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        mensagem: string;
        referenciaTipo: string | null;
        referenciaId: string | null;
        dedupeKey: string;
        criadoEm: Date;
        lidaEm: Date | null;
    }>;
    marcarLida(id: string, req: Request): Promise<{
        id: string;
        dreId: string | null;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusNotificacaoInterna;
        titulo: string;
        escolaId: string | null;
        tipo: string;
        link: string | null;
        origem: string | null;
        userId: string;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        mensagem: string;
        referenciaTipo: string | null;
        referenciaId: string | null;
        dedupeKey: string;
        criadoEm: Date;
        lidaEm: Date | null;
    }>;
    checklists(req: Request): Promise<({
        itens: {
            id: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            responsavelId: string | null;
            titulo: string;
            observacao: string | null;
            codigo: string;
            pendencia: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            checklistId: string;
        }[];
    } & {
        id: string;
        dreId: string | null;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusChecklistImplantacao;
        responsavelId: string | null;
        escolaId: string | null;
        nome: string;
        observacao: string | null;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        criadoEm: Date;
        atualizadoEm: Date;
    })[]>;
    criarChecklist(dto: ChecklistDto, req: Request): Promise<{
        itens: {
            id: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            responsavelId: string | null;
            titulo: string;
            observacao: string | null;
            codigo: string;
            pendencia: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            checklistId: string;
        }[];
    } & {
        id: string;
        dreId: string | null;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusChecklistImplantacao;
        responsavelId: string | null;
        escolaId: string | null;
        nome: string;
        observacao: string | null;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        criadoEm: Date;
        atualizadoEm: Date;
    }>;
    atualizarChecklist(id: string, dto: ChecklistStatusDto, req: Request): Promise<{
        itens: {
            id: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            responsavelId: string | null;
            titulo: string;
            observacao: string | null;
            codigo: string;
            pendencia: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            checklistId: string;
        }[];
    } & {
        id: string;
        dreId: string | null;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusChecklistImplantacao;
        responsavelId: string | null;
        escolaId: string | null;
        nome: string;
        observacao: string | null;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        criadoEm: Date;
        atualizadoEm: Date;
    }>;
    itemChecklist(id: string, dto: ChecklistItemDto, req: Request): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
        responsavelId: string | null;
        titulo: string;
        observacao: string | null;
        codigo: string;
        pendencia: string | null;
        atualizadoEm: Date;
        evidencia: string | null;
        prazo: Date | null;
        checklistId: string;
    }>;
    relatorioChecklist(id: string, req: Request): Promise<{
        checklist: {
            id: string;
            nome: string;
            status: import(".prisma/client").$Enums.StatusChecklistImplantacao;
        };
        concluidos: number;
        pendentes: {
            id: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            responsavelId: string | null;
            titulo: string;
            observacao: string | null;
            codigo: string;
            pendencia: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            checklistId: string;
        }[];
        bloqueios: {
            id: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            responsavelId: string | null;
            titulo: string;
            observacao: string | null;
            codigo: string;
            pendencia: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            checklistId: string;
        }[];
        situacaoGeral: string;
        observacao: string;
    }>;
}
export declare class MonitoramentoController {
    private readonly service;
    constructor(service: GestaoOperacionalService);
    diagnostico(req: Request): Promise<{
        status: string;
        checks: any[];
        indicadores: {
            usuariosAtivos: number;
            configuracoesAtivas: number;
            itensCriticosPendentes: number;
        };
        verificadoEm: string;
    }>;
}
