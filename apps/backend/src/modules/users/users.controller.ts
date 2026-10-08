import { Body, Controller, Delete, Get, Patch, Post, Query, Param } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';

@Controller({ path: 'users', version: '1' })
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get() findAll(@Query() query: any) { return this.service.findAll(query); }
  @Post() create(@Body() body: any) { return this.service.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
