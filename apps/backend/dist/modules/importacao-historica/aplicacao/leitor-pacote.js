"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAMINHO_PACOTE_PADRAO = void 0;
exports.sha256Arquivo = sha256Arquivo;
exports.resolverDentroDoPacote = resolverDentroDoPacote;
exports.validarDocumento = validarDocumento;
exports.carregarPacote = carregarPacote;
exports.agruparDuplicados = agruparDuplicados;
exports.resumirValidacoes = resumirValidacoes;
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.CAMINHO_PACOTE_PADRAO = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
function sha256Arquivo(caminho) {
    return (0, crypto_1.createHash)('sha256').update(fs.readFileSync(caminho)).digest('hex');
}
function resolverDentroDoPacote(raiz, relativo) {
    const absoluto = path.resolve(raiz, relativo);
    const rel = path.relative(raiz, absoluto);
    const escapou = rel.startsWith('..') || path.isAbsolute(rel);
    return { absoluto, escapou };
}
function validarDocumento(raiz, doc) {
    const urls = [doc.url, doc.url_download, doc.url_publicacao].filter((u) => Boolean(u));
    const base = {
        id_documento: doc.id_documento,
        classificacao: 'AUSENTE',
        caminho_rel: doc.caminho ?? null,
        caminho_abs: null,
        sha256_manifesto: doc.sha256 ?? null,
        sha256_calculado: null,
        bytes: null,
        paginas_manifesto: typeof doc.paginas === 'number' ? doc.paginas : null,
        header_pdf: false,
        urls,
        detalhes: [],
    };
    if (!doc.caminho) {
        return { ...base, detalhes: ['sem caminho no manifesto (download falhou na pesquisa: HTTP 404)'] };
    }
    const { absoluto, escapou } = resolverDentroDoPacote(raiz, doc.caminho);
    if (escapou) {
        return { ...base, classificacao: 'FORA_DO_PACOTE', detalhes: [`caminho escapa da raiz do pacote: "${doc.caminho}"`] };
    }
    if (!fs.existsSync(absoluto)) {
        return { ...base, caminho_abs: absoluto, detalhes: ['arquivo inexistente em PACKAGE_DIR'] };
    }
    const buffer = fs.readFileSync(absoluto);
    const headerPdf = buffer.slice(0, 5).toString('latin1') === '%PDF-';
    const hash = (0, crypto_1.createHash)('sha256').update(buffer).digest('hex');
    const atualizado = {
        ...base,
        caminho_abs: absoluto,
        bytes: buffer.length,
        header_pdf: headerPdf,
        sha256_calculado: hash,
    };
    if (!headerPdf) {
        return { ...atualizado, classificacao: 'INVALIDO', detalhes: ['cabeçalho %PDF- ausente'] };
    }
    if (!doc.sha256) {
        return { ...atualizado, classificacao: 'SEM_HASH_MANIFESTO', detalhes: ['manifesto não registra hash'] };
    }
    if (hash !== doc.sha256) {
        return { ...atualizado, classificacao: 'ALTERADO', detalhes: [`sha256 divergente: manifesto=${doc.sha256} calculado=${hash}`] };
    }
    const detalhes = [];
    if (typeof doc.bytes === 'number' && doc.bytes !== buffer.length) {
        detalhes.push(`tamanho difere do manifesto (${buffer.length} vs ${doc.bytes})`);
    }
    return { ...atualizado, classificacao: 'INTEIRO', detalhes };
}
function carregarPacote(raiz = exports.CAMINHO_PACOTE_PADRAO) {
    const manifestoPath = path.join(raiz, 'MANIFESTO_DOCUMENTOS.json');
    if (!fs.existsSync(manifestoPath)) {
        throw new Error(`Manifesto não encontrado: ${manifestoPath}`);
    }
    const bruto = fs.readFileSync(manifestoPath);
    const manifestoSha256 = (0, crypto_1.createHash)('sha256').update(bruto).digest('hex');
    const manifesto = JSON.parse(bruto.toString('utf8'));
    const validacoes = manifesto.documentos.map((doc) => validarDocumento(raiz, doc));
    const validacoesPorId = {};
    for (const v of validacoes)
        validacoesPorId[v.id_documento] = v;
    return { raiz, manifesto, manifestoSha256, manifestoBytes: bruto.length, validacoes, validacoesPorId };
}
function agruparDuplicados(validacoes) {
    const mapa = new Map();
    for (const v of validacoes) {
        if (!v.sha256_calculado)
            continue;
        const lista = mapa.get(v.sha256_calculado) || [];
        lista.push(v);
        mapa.set(v.sha256_calculado, lista);
    }
    const grupos = [];
    for (const [sha256, lista] of mapa) {
        if (lista.length < 2)
            continue;
        const urls = lista.reduce((acc, v) => acc.concat(v.urls), []);
        const caminhos = new Set(lista.map((v) => v.caminho_rel));
        grupos.push({ sha256, ids: lista.map((v) => v.id_documento), urls, mesmoCaminho: caminhos.size === 1 });
    }
    return grupos.sort((a, b) => a.ids[0].localeCompare(b.ids[0]));
}
function resumirValidacoes(validacoes) {
    const resumo = {};
    for (const v of validacoes)
        resumo[v.classificacao] = (resumo[v.classificacao] || 0) + 1;
    return resumo;
}
//# sourceMappingURL=leitor-pacote.js.map