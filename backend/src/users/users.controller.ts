import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CreateUserDto {
  username: string;
  password: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.Manager)
  @Get()
  list() {
    return this.usersService.listUsers();
  }

  @Roles(UserRole.Manager)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto.username, dto.password, UserRole.Admin);
  }
}
