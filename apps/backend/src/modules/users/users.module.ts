import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuditModule } from '../audit/audit.module';

@Module({ imports: [PrismaModule, AuditModule], controllers: [UsersController], providers: [UsersService] })
export class UsersModule {}
