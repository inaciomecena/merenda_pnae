import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';

export const BOOTSTRAP_TOKEN_ENV = 'BOOTSTRAP_ADMIN_TOKEN';

/**
 * SDD-005 — Bootstrap institucional.
 *
 * O RolesGuard exige um vínculo institucional ativo para qualquer rota
 * protegida, e `POST /vinculos` exige ADMIN + vínculo ativo. Em um banco
 * recém-criado (apenas usuários seed, sem vínculos) nenhum administrador
 * consegue criar o primeiro vínculo: dependência circular de inicialização.
 *
 * Este serviço resolve o impasse com controles estritos:
 *  1. exige sessão JWT válida (guard global) e papel ADMIN do token;
 *  2. exige token secreto configurado em `BOOTSTRAP_ADMIN_TOKEN` (comparação
 *     em tempo constante) — sem env, o bootstrap fica indisponível;
 *  3. é de UMA única execução: recusa se já existir qualquer vínculo ADMIN
 *     ativo no banco;
 *  4. grava vínculo ADMIN global (sem escopo de DRE/escola/produtor) e
 *     registra auditoria específica.
 *
 * Não há bypass do RolesGuard e nenhuma permissão é concedida
 * automaticamente: sem o token secreto, o pedido é recusado.
 */
@Injectable()
export class BootstrapVinculoService {
  private readonly logger = new Logger(BootstrapVinculoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async executar(tokenInformado: string | undefined, user: AuthenticatedUser) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Bootstrap restrito ao perfil administrativo.');
    }

    const tokenEsperado = process.env[BOOTSTRAP_TOKEN_ENV];
    if (!tokenEsperado) {
      throw new ServiceUnavailableException(
        'Bootstrap administrativo não habilitado neste ambiente.',
      );
    }
    if (!this.tokenConfere(tokenInformado, tokenEsperado)) {
      throw new ForbiddenException('Token de bootstrap inválido.');
    }

    const conta = await this.prisma.user.findFirst({
      where: { id: user.sub, role: 'ADMIN', active: true, deletedAt: null },
      select: { id: true, email: true, name: true },
    });
    if (!conta) {
      throw new ForbiddenException('Conta administrativa inativa ou inexistente.');
    }

    const existente = await this.prisma.vinculoUsuario.findFirst({
      where: { funcao: 'ADMIN', ativo: true },
      select: { id: true, userId: true },
    });
    if (existente) {
      throw new ConflictException(
        'Bootstrap já executado: já existe vínculo administrativo ativo.',
      );
    }

    const vinculo = await this.prisma.vinculoUsuario.create({
      data: {
        userId: conta.id,
        funcao: 'ADMIN',
        vigenciaInicio: new Date(),
        createdBy: conta.id,
      },
      select: { id: true, userId: true, funcao: true, ativo: true, vigenciaInicio: true },
    });

    await this.audit.log({
      userId: conta.id,
      userName: conta.email,
      userRole: 'ADMIN',
      action: 'BOOTSTRAP_ADMIN_VINCULO',
      entity: 'VinculoUsuario',
      entityId: vinculo.id,
      entityLabel: `${conta.name} - ADMIN (bootstrap)`,
      newValues: JSON.stringify({ funcao: 'ADMIN', vigenciaInicio: vinculo.vigenciaInicio }),
    });

    this.logger.warn(
      `Bootstrap administrativo executado para ${conta.email} (vínculo ${vinculo.id}).`,
    );

    return vinculo;
  }

  /** Comparação em tempo constante; não vaza o motivo da falha. */
  private tokenConfere(informado: string | undefined, esperado: string): boolean {
    if (typeof informado !== 'string' || informado.length === 0) return false;
    const a = Buffer.from(informado, 'utf8');
    const b = Buffer.from(esperado, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
