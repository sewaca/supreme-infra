import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../../shared/guards/jwt.strategy';
import { AuthService } from '../model/Auth.service';
import { UsersService } from '../model/Users.service';
import { AuthController } from './Auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '7d' } }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, UsersService],
})
export class AuthModule {}
