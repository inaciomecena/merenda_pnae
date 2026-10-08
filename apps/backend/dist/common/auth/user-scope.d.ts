export type AuthenticatedUser = {
    sub: string;
    role: 'ADMIN' | 'ESCOLA' | 'EXTENSIONISTA';
    escolaId?: string | null;
    municipioId?: string | null;
};
export declare function requireScope(user: AuthenticatedUser, kind: 'escola' | 'municipio'): string | undefined;
