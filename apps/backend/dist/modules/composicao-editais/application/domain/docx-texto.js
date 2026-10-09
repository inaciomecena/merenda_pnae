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
exports.extrairTextoDocx = extrairTextoDocx;
const zlib = __importStar(require("zlib"));
function extrairTextoDocx(buffer) {
    let offset = 0;
    while (offset + 30 < buffer.length) {
        if (buffer.readUInt32LE(offset) !== 0x04034b50) {
            offset += 1;
            continue;
        }
        const method = buffer.readUInt16LE(offset + 8);
        const compSize = buffer.readUInt32LE(offset + 18);
        const nameLen = buffer.readUInt16LE(offset + 26);
        const extraLen = buffer.readUInt16LE(offset + 28);
        const nameStart = offset + 30;
        const name = buffer.slice(nameStart, nameStart + nameLen).toString('utf8');
        const dataStart = nameStart + nameLen + extraLen;
        if (name === 'word/document.xml' && compSize > 0 && dataStart + compSize <= buffer.length) {
            const compressed = buffer.slice(dataStart, dataStart + compSize);
            const xml = method === 0 ? compressed.toString('utf8') : zlib.inflateRawSync(compressed).toString('utf8');
            return xml
                .replace(/<w:p[^>]*>/g, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        }
        if (compSize === 0)
            return null;
        offset = dataStart + compSize;
    }
    return null;
}
//# sourceMappingURL=docx-texto.js.map