import { Injectable, BadRequestException } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';

export interface DadosNFe {
  numero: string;
  serie: string;
  modelo: string;
  chaveAcesso: string;
  dataEmissao: Date;
  cnpjEmitente?: string;
  cpfEmitente?: string;
  nomeEmitente: string;
  cnpjDestinatario?: string;
  cpfDestinatario?: string;
  valorProdutos: number;
  valorTotal: number;
  valorDesconto: number;
  valorFrete: number;
  valorOutrasDespesas: number;
  itens: ItemNFe[];
}

export interface ItemNFe {
  numeroItem: number;
  codigoProduto: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

@Injectable()
export class XmlFiscalService {
  /**
   * Extrai dados de um XML de NF-e (Nota Fiscal Eletrônica)
   * Suporta versão 4.00 da NF-e
   */
  async extrairDadosNFe(xmlBuffer: Buffer): Promise<DadosNFe> {
    try {
      const xmlString = xmlBuffer.toString('utf8');

      // Validar se é XML válido
      if (!xmlString.trim().startsWith('<?xml') && !xmlString.trim().startsWith('<')) {
        throw new BadRequestException('Arquivo não é um XML válido.');
      }

      const parsed = await parseStringPromise(xmlString, {
        explicitArray: false,
        ignoreAttrs: false,
        mergeAttrs: true,
      });

      // Verificar estrutura de NF-e
      if (!parsed.nfeProc && !parsed.NFe) {
        throw new BadRequestException('XML não é uma NF-e válida.');
      }

      // Extrair o nó principal da nota
      const nfe = parsed.nfeProc?.NFe?.infNFe || parsed.NFe?.infNFe;

      if (!nfe) {
        throw new BadRequestException('Estrutura da NF-e inválida.');
      }

      // Extrair identificação
      const ide = nfe.ide;
      if (!ide) {
        throw new BadRequestException('Dados de identificação não encontrados.');
      }

      // Extrair emitente
      const emit = nfe.emit;
      if (!emit) {
        throw new BadRequestException('Dados do emitente não encontrados.');
      }

      // Extrair destinatário
      const dest = nfe.dest;
      if (!dest) {
        throw new BadRequestException('Dados do destinatário não encontrados.');
      }

      // Extrair totais
      const total = nfe.total?.ICMSTot;
      if (!total) {
        throw new BadRequestException('Totais não encontrados.');
      }

      // Extrair itens
      const detalhes = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
      const itens: ItemNFe[] = detalhes.map((det: any, index: number) => {
        const prod = det.prod;
        return {
          numeroItem: index + 1,
          codigoProduto: prod.cProd || '',
          descricao: prod.xProd || '',
          ncm: prod.NCM || undefined,
          cfop: prod.CFOP || undefined,
          unidade: prod.uCom || '',
          quantidade: parseFloat(prod.qCom || '0'),
          valorUnitario: parseFloat(prod.vUnCom || '0'),
          valorTotal: parseFloat(prod.vProd || '0'),
        };
      });

      // Construir chave de acesso
      const chaveAcesso = nfe.Id?.replace('NFe', '') || ide.chave || '';

      return {
        numero: ide.nNF || '',
        serie: ide.serie || '',
        modelo: ide.mod || '55',
        chaveAcesso,
        dataEmissao: this.parseDataNFe(ide.dhEmi || ide.dEmi),
        cnpjEmitente: emit.CNPJ || undefined,
        cpfEmitente: emit.CPF || undefined,
        nomeEmitente: emit.xNome || emit.xFant || '',
        cnpjDestinatario: dest.CNPJ || undefined,
        cpfDestinatario: dest.CPF || undefined,
        valorProdutos: parseFloat(total.vProd || '0'),
        valorTotal: parseFloat(total.vNF || '0'),
        valorDesconto: parseFloat(total.vDesc || '0'),
        valorFrete: parseFloat(total.vFrete || '0'),
        valorOutrasDespesas: parseFloat(total.vOutro || '0'),
        itens,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erro ao processar XML: ${error.message}`);
    }
  }

  /**
   * Valida se um XML é uma NF-e válida
   */
  async validarXmlNFe(xmlBuffer: Buffer): Promise<boolean> {
    try {
      const xmlString = xmlBuffer.toString('utf8');

      // Verificar se contém assinatura XML (estrutura típica de NF-e)
      if (!xmlString.includes('<NFe') && !xmlString.includes('<nfeProc')) {
        return false;
      }

      const parsed = await parseStringPromise(xmlString, {
        explicitArray: false,
      });

      return !!(parsed.nfeProc || parsed.NFe);
    } catch {
      return false;
    }
  }

  /**
   * Valida chave de acesso de NF-e (44 dígitos)
   */
  validarChaveAcesso(chave: string): boolean {
    // Remover espaços e caracteres não numéricos
    const chaveNumeros = chave.replace(/\D/g, '');

    // Chave de NF-e tem 44 dígitos
    if (chaveNumeros.length !== 44) {
      return false;
    }

    // Validar dígito verificador (simples validação de formato)
    const modelo = chaveNumeros.substring(20, 22);
    return modelo === '55' || modelo === '65'; // 55=NF-e, 65=NFC-e
  }

  /**
   * Converte data no formato da NF-e para Date
   */
  private parseDataNFe(dataString: string): Date {
    try {
      // Formato: 2026-10-11T10:30:00-03:00 ou 2026-10-11
      return new Date(dataString);
    } catch {
      return new Date();
    }
  }

  /**
   * Extrai dados básicos sem parsing completo (para validação rápida)
   */
  async extrairChaveAcessoRapido(xmlBuffer: Buffer): Promise<string | null> {
    try {
      const xmlString = xmlBuffer.toString('utf8');

      // Buscar chave de acesso no atributo Id ou no elemento chNFe
      const matchId = xmlString.match(/Id="NFe(\d{44})"/);
      if (matchId) {
        return matchId[1];
      }

      const matchChave = xmlString.match(/<chNFe>(\d{44})<\/chNFe>/);
      if (matchChave) {
        return matchChave[1];
      }

      return null;
    } catch {
      return null;
    }
  }
}
