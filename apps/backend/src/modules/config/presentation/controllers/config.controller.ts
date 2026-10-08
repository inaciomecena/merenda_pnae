import { Controller, Get, Put, Body, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ConfigService } from '../../application/services/config.service';

@ApiTags('config')
@Controller({ path: 'config', version: '1' })
export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar todas as configurações' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':chave')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Buscar configuração por chave' })
  get(@Param('chave') chave: string) {
    return this.service.get(chave);
  }

  @Put(':chave')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar configuração' })
  set(@Param('chave') chave: string, @Body() body: { valor: string; descricao?: string; tipo?: string }) {
    return this.service.set(chave, body.valor, body.descricao, body.tipo);
  }

  @Put()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar múltiplas configurações' })
  setMany(@Body() body: Array<{ chave: string; valor: string; descricao?: string; tipo?: string }>) {
    return this.service.setMany(body);
  }

  @Post('init')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Inicializar configurações padrão' })
  initDefaults() {
    return this.service.initDefaults();
  }
}
