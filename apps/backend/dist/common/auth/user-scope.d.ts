export type AuthenticatedUser = {
    sub: string;
    email?: string;
    role: 'ADMIN' | 'ESCOLA' | 'EXTENSIONISTA' | 'DRE' | 'PRODUTOR' | 'REPRESENTANTE';
    escolaId?: string | null;
    municipioId?: string | null;
    vinculoId?: string;
};
