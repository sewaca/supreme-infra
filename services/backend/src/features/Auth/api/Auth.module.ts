import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../../../shared/guards/jwt.strategy';
import { AuthService } from '../model/Auth.service';
import { RecipeLikeEntity, UserEntity } from '../model/User.entity';
import { UsersService } from '../model/Users.service';
import { AuthController } from './Auth.controller';

const skipDb = process.env.SKIP_DB_CONNECTION === 'true';

// TypeOrmModule.forFeature нужен только когда БД не пропущена
// Когда SKIP_DB_CONNECTION=true, репозитории уже замоканы глобально
const dbFeatureImports = skipDb ? [] : [TypeOrmModule.forFeature([UserEntity, RecipeLikeEntity])];

@Module({
  imports: [
    ...dbFeatureImports,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, UsersService],
})
export class AuthModule {}
