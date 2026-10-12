import { Injectable, BadRequestException } from '@nestjs/common';

export interface DadosPDFFiscal {
  numero?: string;
  serie?: string;
  chaveAcesso?: string;
  dataEmissao?: string;
  cnpjEmitente?: string;
  nomeEmitente?: string;
  valorTotal?: number;
  textoCompleto: string;
  extraidoComSucesso: boolean;
  metodo: 'texto_incorporado' | 'necessita_ocr' | 'erro';
}

@Injectable()
export class PdfFiscalService {
  /**
   * Extrai dados de um PDF fiscal (DANFE)
   * Versão básica: extrai texto incorporado
   * OCR não implementado (requer biblioteca externa como tesseract)
   */
  async extrairDadosPDF(pdfBuffer: Buffer): Promise<DadosPDFFiscal> {
    try {
      // Verificar se é PDF válido
      if (!this.validarPDF(pdfBuffer)) {
        throw new BadRequestException('Arquivo não é um PDF válido.');
      }

      // Tentar extrair texto incorporado
      const texto = this.extrairTextoIncorporado(pdfBuffer);

      if (!texto || texto.trim().length < 50) {
        // PDF provavelmente é imagem ou não tem texto incorporado
        return {
          textoCompleto: '',
          extraidoComSucesso: false,
          metodo: 'necessita_ocr',
        };
      }

      // Extrair informações básicas por regex
      const dados = this.extrairCamposPorRegex(texto);

      return {
        ...dados,
        textoCompleto: texto,
        extraidoComSucesso: true,
        metodo: 'texto_incorporado',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      return {
        textoCompleto: '',
        extraidoComSucesso: false,
        metodo: 'erro',
      };
    }
  }

  /**
   * Valida se o buffer é um PDF válido
   */
  private validarPDF(buffer: Buffer): boolean {
    // PDF começa com %PDF-
    const header = buffer.subarray(0, 5).toString('ascii');
    return header === '%PDF-';
  }

  /**
   * Extrai texto incorporado do PDF (versão simplificada)
   * NOTA: Esta é uma extração muito básica. Para extração robusta,
   * usar biblioteca como pdf-parse ou pdfjs-dist
   */
  private extrairTextoIncorporado(buffer: Buffer): string {
    try {
      // Buscar objetos de stream de texto no PDF
      const pdfString = buffer.toString('latin1');
      const streams: string[] = [];

      // Regex muito simplificada para localizar objetos de texto
      // Em produção, usar biblioteca especializada
      const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
      let match;

      while ((match = streamRegex.exec(pdfString)) !== null) {
        streams.push(match[1]);
      }

      // Tentar decodificar texto simples
      let textoExtraido = '';
      for (const stream of streams) {
        // Buscar comandos Tj (show text) e TJ (show text array)
        const tjRegex = /\((.*?)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(stream)) !== null) {
          textoExtraido += tjMatch[1] + ' ';
        }
      }

      return textoExtraido.trim();
    } catch {
      return '';
    }
  }

  /**
   * Extrai campos conhecidos de DANFE por expressões regulares
   */
  private extrairCamposPorRegex(texto: string): Partial<DadosPDFFiscal> {
    const dados: Partial<DadosPDFFiscal> = {};

    // Chave de acesso (44 dígitos)
    const chaveMatch = texto.match(/(\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4})/);
    if (chaveMatch) {
      dados.chaveAcesso = chaveMatch[1].replace(/\s/g, '');
    } else {
      const chaveMatch2 = texto.match(/\b(\d{44})\b/);
      if (chaveMatch2) {
        dados.chaveAcesso = chaveMatch2[1];
      }
    }

    // Número da nota
    const numeroMatch = texto.match(/N[ºo]?\s*(\d{6,9})/i);
    if (numeroMatch) {
      dados.numero = numeroMatch[1];
    }

    // Série
    const serieMatch = texto.match(/S[ée]rie\s*(\d{1,3})/i);
    if (serieMatch) {
      dados.serie = serieMatch[1];
    }

    // Data de emissão
    const dataMatch = texto.match(/Emiss[ãa]o\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (dataMatch) {
      dados.dataEmissao = dataMatch[1];
    }

    // CNPJ emissor
    const cnpjMatch = texto.match(/CNPJ\s*:?\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
    if (cnpjMatch) {
      dados.cnpjEmitente = cnpjMatch[1].replace(/[^\d]/g, '');
    }

    // Valor total
    const valorMatch = texto.match(/Valor\s+Total\s+da\s+Nota\s*:?\s*R?\$?\s*([\d.,]+)/i);
    if (valorMatch) {
      const valorString = valorMatch[1].replace('.', '').replace(',', '.');
      dados.valorTotal = parseFloat(valorString);
    }

    return dados;
  }

  /**
   * Valida se o PDF parece ser uma DANFE
   */
  validarDANFE(buffer: Buffer): boolean {
    try {
      const texto = this.extrairTextoIncorporado(buffer);
      // Verificar presença de palavras-chave típicas de DANFE
      const palavrasChave = [
        'DANFE',
        'NOTA FISCAL ELETRÔNICA',
        'NF-e',
        'CHAVE DE ACESSO',
      ];

      return palavrasChave.some((palavra) => texto.toUpperCase().includes(palavra));
    } catch {
      return false;
    }
  }
}
