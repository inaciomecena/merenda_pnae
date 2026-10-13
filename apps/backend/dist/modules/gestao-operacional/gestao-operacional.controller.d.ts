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
        escopo: "ADMIN" | "ESCOLA" | "EXTENSIONISTA" | "DRE" | "PRODUTOR" | "REPRESENTANTE";
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
        escopo: "ADMIN" | "ESCOLA" | "EXTENSIONISTA" | "DRE" | "PRODUTOR" | "REPRESENTANTE";
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
        createdAt: Date;
        updatedAt: Date;
        escolaId: string | null;
        municipioId: string | null;
        ativo: boolean;
        dreId: string | null;
        chave: string;
        tipo: string;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        versao: number;
        responsavelId: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        escolaId: string | null;
        municipioId: string | null;
        ativo: boolean;
        dreId: string | null;
        chave: string;
        valor: string;
        tipo: string;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        versao: number;
        responsavelId: string | null;
        permiteSobrescrita: boolean;
        vigenteDesde: Date;
        vigenteAte: Date | null;
    }>;
    atualizarConfiguracao(dto: ConfiguracaoInstitucionalDto, req: Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        escolaId: string | null;
        municipioId: string | null;
        ativo: boolean;
        dreId: string | null;
        chave: string;
        valor: string;
        tipo: string;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        versao: number;
        responsavelId: string | null;
        permiteSobrescrita: boolean;
        vigenteDesde: Date;
        vigenteAte: Date | null;
    }>;
    parametros(req: Request): Promise<({
        versoes: {
            id: string;
            createdAt: Date;
            escolaId: string | null;
            municipioId: string | null;
            dreId: string | null;
            status: import(".prisma/client").$Enums.StatusParametroOperacional;
            valor: string;
            escopo: import(".prisma/client").$Enums.EscopoInstitucional;
            versao: number;
            responsavelId: string | null;
            justificativa: string | null;
            vigenteDesde: Date;
            vigenteAte: Date | null;
            fonteNormativa: string | null;
            parametroId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        codigo: string;
        status: import(".prisma/client").$Enums.StatusParametroOperacional;
        descricao: string;
        unidade: string | null;
        tipo: string;
        versaoAtual: number;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        responsavelId: string | null;
        vigenteDesde: Date | null;
        vigenteAte: Date | null;
        fonteNormativa: string | null;
        permiteAlteracao: boolean;
    })[]>;
    criarParametro(dto: ParametroOperacionalDto, req: Request): Promise<{
        versoes: {
            id: string;
            createdAt: Date;
            escolaId: string | null;
            municipioId: string | null;
            dreId: string | null;
            status: import(".prisma/client").$Enums.StatusParametroOperacional;
            valor: string;
            escopo: import(".prisma/client").$Enums.EscopoInstitucional;
            versao: number;
            responsavelId: string | null;
            justificativa: string | null;
            vigenteDesde: Date;
            vigenteAte: Date | null;
            fonteNormativa: string | null;
            parametroId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        codigo: string;
        status: import(".prisma/client").$Enums.StatusParametroOperacional;
        descricao: string;
        unidade: string | null;
        tipo: string;
        versaoAtual: number;
        origem: import(".prisma/client").$Enums.OrigemConfiguracao;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        responsavelId: string | null;
        vigenteDesde: Date | null;
        vigenteAte: Date | null;
        fonteNormativa: string | null;
        permiteAlteracao: boolean;
    }>;
    versionarParametro(id: string, dto: ParametroOperacionalDto, req: Request): Promise<{
        id: string;
        createdAt: Date;
        escolaId: string | null;
        municipioId: string | null;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusParametroOperacional;
        valor: string;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        versao: number;
        responsavelId: string | null;
        justificativa: string | null;
        vigenteDesde: Date;
        vigenteAte: Date | null;
        fonteNormativa: string | null;
        parametroId: string;
    }>;
    notificacoes(page: string, limit: string, req: Request): Promise<{
        items: {
            id: string;
            escolaId: string | null;
            municipioId: string | null;
            userId: string;
            dreId: string | null;
            link: string | null;
            titulo: string;
            status: import(".prisma/client").$Enums.StatusNotificacaoInterna;
            tipo: string;
            origem: string | null;
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
        escolaId: string | null;
        municipioId: string | null;
        userId: string;
        dreId: string | null;
        link: string | null;
        titulo: string;
        status: import(".prisma/client").$Enums.StatusNotificacaoInterna;
        tipo: string;
        origem: string | null;
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
        escolaId: string | null;
        municipioId: string | null;
        userId: string;
        dreId: string | null;
        link: string | null;
        titulo: string;
        status: import(".prisma/client").$Enums.StatusNotificacaoInterna;
        tipo: string;
        origem: string | null;
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
            codigo: string;
            titulo: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            observacao: string | null;
            responsavelId: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            pendencia: string | null;
            checklistId: string;
        }[];
    } & {
        id: string;
        escolaId: string | null;
        municipioId: string | null;
        nome: string;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusChecklistImplantacao;
        observacao: string | null;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        responsavelId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
    })[]>;
    criarChecklist(dto: ChecklistDto, req: Request): Promise<{
        itens: {
            id: string;
            codigo: string;
            titulo: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            observacao: string | null;
            responsavelId: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            pendencia: string | null;
            checklistId: string;
        }[];
    } & {
        id: string;
        escolaId: string | null;
        municipioId: string | null;
        nome: string;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusChecklistImplantacao;
        observacao: string | null;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        responsavelId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
    }>;
    atualizarChecklist(id: string, dto: ChecklistStatusDto, req: Request): Promise<{
        itens: {
            id: string;
            codigo: string;
            titulo: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            observacao: string | null;
            responsavelId: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            pendencia: string | null;
            checklistId: string;
        }[];
    } & {
        id: string;
        escolaId: string | null;
        municipioId: string | null;
        nome: string;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusChecklistImplantacao;
        observacao: string | null;
        escopo: import(".prisma/client").$Enums.EscopoInstitucional;
        responsavelId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
    }>;
    itemChecklist(id: string, dto: ChecklistItemDto, req: Request): Promise<{
        id: string;
        codigo: string;
        titulo: string;
        status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
        observacao: string | null;
        responsavelId: string | null;
        atualizadoEm: Date;
        evidencia: string | null;
        prazo: Date | null;
        pendencia: string | null;
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
            codigo: string;
            titulo: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            observacao: string | null;
            responsavelId: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            pendencia: string | null;
            checklistId: string;
        }[];
        bloqueios: {
            id: string;
            codigo: string;
            titulo: string;
            status: import(".prisma/client").$Enums.StatusItemChecklistImplantacao;
            observacao: string | null;
            responsavelId: string | null;
            atualizadoEm: Date;
            evidencia: string | null;
            prazo: Date | null;
            pendencia: string | null;
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
