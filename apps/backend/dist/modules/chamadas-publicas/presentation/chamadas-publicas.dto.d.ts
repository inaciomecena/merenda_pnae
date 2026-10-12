import { CategoriaParticipante, StatusHabilitacaoChamada, StatusRecursoChamada, StatusSelecaoChamada } from '@prisma/client';
export declare class CreateChamadaDto {
    editalId: string;
    numero: string;
    exercicio: number;
    objeto: string;
    entidadeExecutoraId?: string;
    dreId?: string;
    municipioId?: string;
    inscricoesInicio: string;
    inscricoesFim: string;
    dataAbertura?: string;
    prazoDocumentos?: string;
    localApresentacao?: string;
    formaApresentacao?: string;
    observacoes?: string;
    escolaIds?: string[];
}
export declare class UpdateChamadaDto extends CreateChamadaDto {
    versao?: number;
}
export declare class InscricaoDto {
    produtorId: string;
    categoria: CategoriaParticipante;
    representante?: string;
    contato?: string;
    observacoes?: string;
}
export declare class ProjetoItemDto {
    produto: string;
    editalItemId?: string;
    quantidade?: number;
    unidade?: string;
    precoUnitario: number;
    especificacao?: string;
}
export declare class ProjetoDto {
    produtorId: string;
    categoria: CategoriaParticipante;
    identificacaoProjeto?: string;
    itens: ProjetoItemDto[];
}
export declare class HabilitacaoDto {
    status: StatusHabilitacaoChamada;
    parecer?: string;
    pendencias?: string;
}
export declare class ClassificacaoDto {
    propostaId: string;
    editalItemId: string;
    prioridade: number;
    criterio: string;
    valorConsiderado?: number;
    justificativa?: string;
}
export declare class SelecaoDto {
    status: StatusSelecaoChamada;
    quantidade: number;
    justificativa?: string;
}
export declare class RecursoDto {
    produtorId: string;
    propostaId?: string;
    fundamentacao: string;
    prazoFinal?: string;
}
export declare class DecisaoRecursoDto {
    status: StatusRecursoChamada;
    decisao: string;
}
export declare class HomologacaoDto {
    fundamentacao: string;
    resultadoId?: string;
}
