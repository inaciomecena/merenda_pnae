"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarNome = normalizarNome;
exports.resolverDRE = resolverDRE;
exports.resolverMunicipio = resolverMunicipio;
exports.resolverEntidadeExecutora = resolverEntidadeExecutora;
exports.resolverEscola = resolverEscola;
function normalizarNome(valor) {
    if (!valor)
        return '';
    return String(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^dre\s+/, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function apenasDigitos(valor) {
    return (valor || '').replace(/\D/g, '');
}
function resolverDRE(bruto, snapshot) {
    const alvo = normalizarNome(bruto);
    if (!alvo) {
        return { bruto: bruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: 'nome de DRE ausente no pacote', candidatos: [] };
    }
    const candidatos = snapshot.dres.filter((d) => normalizarNome(d.nome) === alvo || normalizarNome(d.municipioSede) === alvo || normalizarNome(d.codigo) === alvo);
    if (candidatos.length === 1) {
        return { bruto: bruto ?? null, status: 'CONFIRMADO', id: candidatos[0].id, detalhe: `DRE "${candidatos[0].nome}" (${candidatos[0].codigo})`, candidatos: [] };
    }
    if (candidatos.length > 1) {
        return {
            bruto: bruto ?? null,
            status: 'AMBIGUO',
            id: null,
            detalhe: `${candidatos.length} DREs correspondem a "${bruto}"; revisão manual necessária`,
            candidatos: candidatos.map((c) => ({ id: c.id, nome: c.nome, codigo: c.codigo })),
        };
    }
    return { bruto: bruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: `nenhuma DRE cadastrada corresponde a "${bruto}"`, candidatos: [] };
}
function resolverMunicipio(bruto, codigoIbgeBruto, snapshot) {
    const ibge = apenasDigitos(codigoIbgeBruto);
    if (ibge) {
        const porIbge = snapshot.municipios.filter((m) => apenasDigitos(m.codigoIbge) === ibge);
        if (porIbge.length === 1) {
            return { bruto: bruto ?? null, status: 'CONFIRMADO', id: porIbge[0].id, detalhe: `IBGE ${ibge} -> "${porIbge[0].nome}"`, candidatos: [] };
        }
        if (porIbge.length > 1) {
            return {
                bruto: bruto ?? null,
                status: 'AMBIGUO',
                id: null,
                detalhe: `IBGE ${ibge} duplicado no cadastro`,
                candidatos: porIbge.map((m) => ({ id: m.id, nome: m.nome, codigo: m.codigoIbge })),
            };
        }
    }
    const alvo = normalizarNome(bruto);
    if (!alvo) {
        return { bruto: bruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: 'município ausente no pacote', candidatos: [] };
    }
    const candidatos = snapshot.municipios.filter((m) => normalizarNome(m.nome) === alvo || normalizarNome(m.nomeNormalizado) === alvo);
    if (candidatos.length === 1) {
        return {
            bruto: bruto ?? null,
            status: 'CONFIRMADO',
            id: candidatos[0].id,
            detalhe: `"${candidatos[0].nome}" (IBGE ${candidatos[0].codigoIbge ?? 's/n'})`,
            candidatos: [],
        };
    }
    if (candidatos.length > 1) {
        return {
            bruto: bruto ?? null,
            status: 'AMBIGUO',
            id: null,
            detalhe: `${candidatos.length} municípios correspondem a "${bruto}"`,
            candidatos: candidatos.map((m) => ({ id: m.id, nome: m.nome, codigo: m.codigoIbge })),
        };
    }
    return { bruto: bruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: `nenhum município cadastrado corresponde a "${bruto}"`, candidatos: [] };
}
function resolverEntidadeExecutora(nomeBruto, cnpjBruto, snapshot) {
    const cnpj = apenasDigitos(cnpjBruto);
    if (cnpj) {
        const porCnpj = snapshot.entidadesExecutoras.filter((e) => apenasDigitos(e.cnpj) === cnpj);
        if (porCnpj.length === 1) {
            return { bruto: nomeBruto ?? cnpjBruto ?? null, status: 'CONFIRMADO', id: porCnpj[0].id, detalhe: `CNPJ ${cnpj} -> "${porCnpj[0].nome}"`, candidatos: [] };
        }
        if (porCnpj.length > 1) {
            return {
                bruto: nomeBruto ?? cnpjBruto ?? null,
                status: 'AMBIGUO',
                id: null,
                detalhe: `CNPJ ${cnpj} duplicado`,
                candidatos: porCnpj.map((e) => ({ id: e.id, nome: e.nome, codigo: e.cnpj })),
            };
        }
    }
    const alvo = normalizarNome(nomeBruto);
    if (!alvo) {
        return { bruto: nomeBruto ?? null, status: 'PENDENTE', id: null, detalhe: 'sem CNPJ nem nome de entidade executora no pacote', candidatos: [] };
    }
    const candidatos = snapshot.entidadesExecutoras.filter((e) => normalizarNome(e.nome) === alvo);
    if (candidatos.length === 1) {
        return {
            bruto: nomeBruto ?? null,
            status: cnpj ? 'CONFIRMADO' : 'PENDENTE',
            id: candidatos[0].id,
            detalhe: cnpj
                ? `"${candidatos[0].nome}"`
                : `"${candidatos[0].nome}" resolvido por nome; CNPJ ausente no pacote — vínculo depende de conferência`,
            candidatos: [],
        };
    }
    if (candidatos.length > 1) {
        return {
            bruto: nomeBruto ?? null,
            status: 'AMBIGUO',
            id: null,
            detalhe: `${candidatos.length} entidades correspondem a "${nomeBruto}"`,
            candidatos: candidatos.map((e) => ({ id: e.id, nome: e.nome, codigo: e.cnpj })),
        };
    }
    return { bruto: nomeBruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: `nenhuma entidade executora corresponde a "${nomeBruto}"`, candidatos: [] };
}
function resolverEscola(entrada, snapshot) {
    const inep = apenasDigitos(entrada.inep);
    let candidatos = [];
    let criterio = '';
    if (inep) {
        candidatos = snapshot.escolas.filter((e) => apenasDigitos(e.codigoInep) === inep);
        criterio = `INEP ${inep}`;
    }
    if (candidatos.length === 0) {
        const alvo = normalizarNome(entrada.nome);
        if (!alvo) {
            return {
                bruto: entrada.nome ?? null,
                status: 'NAO_ENCONTRADO',
                id: null,
                detalhe: 'escola sem INEP nem nome',
                candidatos: [],
                vinculoDRE: 'NAO_VERIFICADO',
            };
        }
        candidatos = snapshot.escolas.filter((e) => normalizarNome(e.nome) === alvo && (!entrada.municipioId || e.municipioId === entrada.municipioId));
        criterio = `nome "${entrada.nome}"${entrada.municipioId ? ' + município' : ''}`;
    }
    const base = { bruto: entrada.nome ?? null, candidatos: [] };
    if (candidatos.length === 1) {
        const escola = candidatos[0];
        let vinculoDRE = 'NAO_VERIFICADO';
        if (entrada.dreId) {
            const vinculo = snapshot.vinculosEscolaDRE.find((v) => v.escolaId === escola.id &&
                v.dreId === entrada.dreId &&
                v.ativo &&
                new Date(v.vigenciaInicio) <= entrada.dataReferencia &&
                (!v.vigenciaFim || new Date(v.vigenciaFim) >= entrada.dataReferencia));
            vinculoDRE = vinculo ? 'CONFIRMADO' : 'SEM_VINCULO';
        }
        return {
            ...base,
            status: 'CONFIRMADO',
            id: escola.id,
            detalhe: vinculoDRE === 'CONFIRMADO'
                ? `"${escola.nome}" (${criterio}) com vínculo DRE ativo`
                : `"${escola.nome}" (${criterio})${vinculoDRE === 'SEM_VINCULO' ? ' SEM vínculo DRE ativo na data de referência' : ''}`,
            vinculoDRE,
        };
    }
    if (candidatos.length > 1) {
        return {
            ...base,
            status: 'AMBIGUO',
            id: null,
            detalhe: `${candidatos.length} escolas correspondem a ${criterio}`,
            candidatos: candidatos.slice(0, 10).map((e) => ({ id: e.id, nome: e.nome, codigo: e.codigoInep })),
            vinculoDRE: 'NAO_VERIFICADO',
        };
    }
    return { ...base, status: 'NAO_ENCONTRADO', id: null, detalhe: `nenhuma escola corresponde a ${criterio}`, vinculoDRE: 'NAO_VERIFICADO' };
}
//# sourceMappingURL=resolucao-institucional.js.map