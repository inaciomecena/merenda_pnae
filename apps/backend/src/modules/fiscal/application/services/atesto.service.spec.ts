import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AtestoService } from './atesto.service';
import { FISCAL_LIMITE_ARQUIVO_BYTES } from './fiscal-validacao';

const user = { sub: 'u1', email: 'dre@x.com', role: 'DRE' as const };

function nota(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    contratoId: 'contrato-1',
    fornecedorId: 'fornecedor-1',
    status: 'AGUARDANDO_ATESTO',
    resultadoConciliacao: 'CONCILIADA',
    valorTotal: new Prisma.Decimal('1000.00'),
    ...overrides,
  };
}

function linhaAtesto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'atesto-1',
    notaFiscalId: 'nf-1',
    valorAtestado: new Prisma.Decimal('600.00'),
    status: 'ATESTADO',
    dataAtesto: new Date('2026-03-02T00:00:00.000Z'),
    createdAt: new Date('2026-03-02T00:00:00.000Z'),
    justificativa: null,
    responsavelId: 'u1',
    hashSha256: null,
    versao: 1,
    ...overrides,
  };
}

function arquivoComprovante(opcoes: { conteudo?: Buffer; mimetype?: string } = {}): Express.Multer.File {
  const buffer = opcoes.conteudo ?? Buffer.from('%PDF-1.4 comprovante de atesto');
  return {
    fieldname: 'comprovante',
    originalname: 'comprovante.pdf',
    encoding: '7bit',
    mimetype: opcoes.mimetype ?? 'application/pdf',
    size: buffer.length,
    buffer,
  } as unknown as Express.Multer.File;
}

function raizDocumental(notaFiscalId: string): string {
  return path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
}

function montarServico(opcoes: {
  nota?: Record<string, unknown> | null;
  atestos?: Record<string, unknown>[];
  atesto?: Record<string, unknown> | null;
  impeditivas?: number;
  somaAtestado?: string;
  statusAtualNota?: string;
  countUpdate?: number;
  exigirErro?: Error;
} = {}) {
  const tx = {
    $queryRaw: jest.fn(async () => []),
    notaFiscal: {
      findUnique: jest.fn(async () => ({
        contratoId: 'contrato-1',
        status: opcoes.statusAtualNota ?? 'AGUARDANDO_ATESTO',
        valorTotal: new Prisma.Decimal('1000.00'),
      })),
      updateMany: jest.fn(async () => ({ count: opcoes.countUpdate ?? 1 })),
    },
    atesto: {
      aggregate: jest.fn(async () => ({
        _sum: { valorAtestado: new Prisma.Decimal(opcoes.somaAtestado ?? '0') },
      })),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'atesto-1',
        dataAtesto: new Date('2026-03-02T00:00:00.000Z'),
        hashSha256: null,
        versao: 1,
        ...args.data,
      })),
    },
  };

  const prisma = {
    notaFiscal: {
      findFirst: jest.fn(async () => ('nota' in opcoes ? opcoes.nota : nota())),
    },
    divergenciaFiscal: {
      count: jest.fn(async () => opcoes.impeditivas ?? 0),
    },
    atesto: {
      findMany: jest.fn(async () => opcoes.atestos ?? []),
      findFirst: jest.fn(async () => ('atesto' in opcoes ? opcoes.atesto : null)),
    },
    $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };

  const audit = { log: jest.fn(async () => undefined) };
  const acesso = {
    exigir: opcoes.exigirErro
      ? jest.fn().mockRejectedValue(opcoes.exigirErro)
      : jest.fn().mockResolvedValue(undefined),
  };

  const servico = new AtestoService(prisma as never, audit as never, acesso as never);

  return { servico, prisma, audit, acesso, tx };
}

describe('SDD-005: atesto de nota fiscal', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lista os atestos da nota aplicando o escopo e derivando INTEGRAL/PARCIAL do saldo', async () => {
    const { servico, acesso } = montarServico({
      nota: nota(),
      atestos: [
        linhaAtesto({
          id: 'atesto-2',
          valorAtestado: new Prisma.Decimal('400.00'),
          dataAtesto: new Date('2026-03-04T00:00:00.000Z'),
          createdAt: new Date('2026-03-04T00:00:00.000Z'),
          hashSha256: 'hash-2',
        }),
        linhaAtesto(),
      ],
    });

    const resultado = await servico.listarPorNota('nf-1', user);

    expect(acesso.exigir).toHaveBeenCalledWith(
      user,
      { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
      'CONSULTAR',
    );
    expect(resultado).toHaveLength(2);
    const tipos = Object.fromEntries(resultado.map((atesto) => [atesto.id, atesto.tipo] as const));
    expect(tipos).toEqual({ 'atesto-1': 'PARCIAL', 'atesto-2': 'INTEGRAL' });
    expect(resultado[0].comprovante).toEqual({ id: 'atesto-2', titulo: 'Comprovante de atesto', versao: 1 });
    expect(resultado[1].comprovante).toBeNull();
  });

  it('registra atesto parcial sobre o saldo e audita sem transicionar a nota', async () => {
    const { servico, tx, audit } = montarServico({});

    const resultado = await servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '400.00' }, user);

    expect(resultado.status).toBe('ATESTADO');
    expect(resultado.tipo).toBe('PARCIAL');
    expect(Number(resultado.valorAtestado)).toBe(400);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.atesto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notaFiscalId: 'nf-1',
          contratoId: 'contrato-1',
          responsavelId: 'u1',
          status: 'ATESTADO',
          createdBy: 'u1',
          versao: 1,
        }),
      }),
    );
    expect(tx.notaFiscal.updateMany).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'NOTA_FISCAL_ATESTADA',
        entityLabel: '12345',
        newValues: expect.objectContaining({ tipo: 'PARCIAL', notaAtualizada: false, saldoRestante: '600' }),
      }),
    );
  });

  it('transiciona a nota para ATESTADA quando o atesto zera o saldo', async () => {
    const { servico, tx, audit } = montarServico({});

    const resultado = await servico.criar('nf-1', { tipo: 'INTEGRAL', valorAtestado: '1000.00' }, user);

    expect(resultado.tipo).toBe('INTEGRAL');
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'nf-1', status: 'AGUARDANDO_ATESTO' },
        data: { status: 'ATESTADA', updatedBy: 'u1' },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        newValues: expect.objectContaining({ notaAtualizada: true, saldoRestante: '0' }),
      }),
    );
  });

  it('grava o comprovante com sha256 quando o arquivo é válido', async () => {
    const { servico, tx } = montarServico({});
    const mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as never);
    const writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined as never);
    const conteudo = Buffer.from('%PDF-1.4 comprovante de atesto');

    const resultado = await servico.criar(
      'nf-1',
      { tipo: 'PARCIAL', valorAtestado: '100.00', comprovante: arquivoComprovante({ conteudo }) },
      user,
    );

    const hashEsperado = createHash('sha256').update(conteudo).digest('hex');
    expect(mkdir).toHaveBeenCalledWith(path.join(raizDocumental('nf-1')), { recursive: true });
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(resultado.comprovante).not.toBeNull();
    expect(tx.atesto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hashSha256: hashEsperado,
          documentoPath: expect.stringContaining(path.join(raizDocumental('nf-1'), 'atesto-')),
        }),
      }),
    );
  });

  it('recusa atesto com valor acima do saldo disponível', async () => {
    const { servico, tx } = montarServico({ somaAtestado: '200.00' });

    await expect(
      servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '900.00' }, user),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.atesto.create).not.toHaveBeenCalled();
  });

  it('recusa atesto quando a nota não está aguardando atesto', async () => {
    const { servico, tx } = montarServico({ nota: nota({ status: 'ATESTADA' }) });

    await expect(
      servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '100.00' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });

  it('impede atestar com conciliação divergente ou sem conciliação', async () => {
    const divergente = montarServico({ nota: nota({ resultadoConciliacao: 'DIVERGENTE' }) });
    await expect(
      divergente.servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '100.00' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);

    const semConciliacao = montarServico({ nota: nota({ resultadoConciliacao: null }) });
    await expect(
      semConciliacao.servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '100.00' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('impede atestar enquanto houver divergência ALTA/IMPEDITIVA em aberto', async () => {
    const { servico, prisma } = montarServico({ impeditivas: 1 });

    await expect(
      servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '100.00' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.divergenciaFiscal.count).toHaveBeenCalledWith({
      where: { notaFiscalId: 'nf-1', status: 'ABERTA', severidade: { in: ['IMPEDITIVA', 'ALTA'] } },
    });
  });

  it('exige que o atesto INTEGRAL corresponda exatamente ao saldo', async () => {
    const { servico } = montarServico({});

    await expect(
      servico.criar('nf-1', { tipo: 'INTEGRAL', valorAtestado: '900.00' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('exige que o atesto PARCIAL seja menor que o saldo', async () => {
    const { servico } = montarServico({});

    await expect(
      servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '1000.00' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita valorAtestado vazio ou não numérico', async () => {
    const { servico } = montarServico({});

    await expect(servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '' }, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '-5.00' }, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejeita comprovante vazio, acima do limite e com MIME type não fiscal', async () => {
    const { servico } = montarServico({});

    await expect(
      servico.criar(
        'nf-1',
        { tipo: 'PARCIAL', valorAtestado: '100.00', comprovante: arquivoComprovante({ conteudo: Buffer.alloc(0) }) },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      servico.criar(
        'nf-1',
        {
          tipo: 'PARCIAL',
          valorAtestado: '100.00',
          comprovante: arquivoComprovante({ conteudo: Buffer.alloc(FISCAL_LIMITE_ARQUIVO_BYTES + 1) }),
        },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      servico.criar(
        'nf-1',
        { tipo: 'PARCIAL', valorAtestado: '100.00', comprovante: arquivoComprovante({ mimetype: 'image/png' }) },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('falha com conflito quando a nota sai de AGUARDANDO_ATESTO dentro da transação', async () => {
    const { servico } = montarServico({ statusAtualNota: 'ATESTADA' });

    await expect(
      servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '100.00' }, user),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('falha com conflito quando a transição para ATESTADA não afeta nenhuma linha', async () => {
    const { servico } = montarServico({ countUpdate: 0 });

    await expect(
      servico.criar('nf-1', { tipo: 'INTEGRAL', valorAtestado: '1000.00' }, user),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('bloqueia atesto sem permissão no escopo', async () => {
    const { servico, audit } = montarServico({ exigirErro: new ForbiddenException('sem permissão') });

    await expect(
      servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '100.00' }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.log).not.toHaveBeenCalled();
  });

  describe('obterComprovante', () => {
    it('falha com NotFound quando o atesto não tem comprovante gravado', async () => {
      const { servico } = montarServico({
        atesto: { id: 'atesto-1', notaFiscalId: 'nf-1', documentoPath: null, hashSha256: null },
      });

      await expect(servico.obterComprovante('nf-1', 'atesto-1', user)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falha com NotFound quando o atesto não pertence à nota', async () => {
      const { servico } = montarServico({ atesto: null });

      await expect(servico.obterComprovante('nf-1', 'outro-atesto', user)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('bloqueia path documental fora da pasta da nota (path traversal)', async () => {
      const { servico } = montarServico({
        atesto: {
          id: 'atesto-1',
          notaFiscalId: 'nf-1',
          documentoPath: path.resolve(process.cwd(), 'outro', 'comprovante.pdf'),
          hashSha256: 'hash-esperado',
        },
      });

      await expect(servico.obterComprovante('nf-1', 'atesto-1', user)).rejects.toBeInstanceOf(ConflictException);
    });

    it('retorna o comprovante quando o sha256 do arquivo confere', async () => {
      const conteudo = Buffer.from('conteudo do comprovante');
      const caminho = path.join(raizDocumental('nf-1'), 'atesto-1.pdf');
      const { servico } = montarServico({
        atesto: {
          id: 'atesto-1',
          notaFiscalId: 'nf-1',
          documentoPath: caminho,
          hashSha256: createHash('sha256').update(conteudo).digest('hex'),
        },
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(conteudo as never);

      const resultado = await servico.obterComprovante('nf-1', 'atesto-1', user);

      expect(resultado.caminho).toBe(caminho);
      expect(resultado.nome).toBe('atesto-atesto-1.pdf');
      expect(resultado.mimeType).toBe('application/pdf');
    });

    it('detecta integridade divergente entre o arquivo e o hash gravado', async () => {
      const caminho = path.join(raizDocumental('nf-1'), 'atesto-1.pdf');
      const { servico } = montarServico({
        atesto: {
          id: 'atesto-1',
          notaFiscalId: 'nf-1',
          documentoPath: caminho,
          hashSha256: 'hash-gravado-divergente',
        },
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('conteudo adulterado') as never);

      await expect(servico.obterComprovante('nf-1', 'atesto-1', user)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
