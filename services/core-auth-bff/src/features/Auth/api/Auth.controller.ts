import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard, ZodValidationPipe } from '@supreme-int/nestjs-shared';
import { AuthService } from '../model/Auth.service';
import { type LoginDto, loginSchema, type RegisterDto, registerSchema } from '../model/auth.dto';
import { UsersService } from '../model/Users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: { id: number; email: string; name: string } }) {
    return req.user;
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUserById(@Param('id') id: string) {
    const userId = Number.parseInt(id, 10);
    if (Number.isNaN(userId)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    const userId = Number.parseInt(id, 10);
    if (Number.isNaN(userId)) {
      throw new NotFoundException('User not found');
    }

    const deleted = await this.usersService.delete(userId);
    if (!deleted) {
      throw new NotFoundException('User not found');
    }

    return { success: true };
  }
}
