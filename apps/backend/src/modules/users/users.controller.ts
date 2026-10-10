import { Body, Controller, Delete, Get, Patch, Post, Query, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../common/auth/user-scope';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';

@Controller({ path: 'users', version: '1' })
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get() findAll(@Query() query: any) { return this.service.findAll(query); }
  @Post() create(@Body() body: any) { return this.service.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any, @Req() req: Request) { return this.service.update(id, body, req.user as AuthenticatedUser); }
  @Delete(':id') remove(@Param('id') id: string, @Req() req: Request) { return this.service.remove(id, req.user as AuthenticatedUser); }
}
