import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuditService } from '../../application/services/audit.service';

@ApiTags('audit')
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar logs de auditoria' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Estatísticas de auditoria' })
  getStats() {
    return this.service.getStats();
  }
}
