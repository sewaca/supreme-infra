import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '@supreme-int/nestjs-shared';
import { RecipeLikeEntity } from '../model/RecipeLike.entity';
import { RecipeLikesController } from './RecipeLikes.controller';
import { RecipeLikesService } from './RecipeLikes.service';

const skipDb = process.env.SKIP_DB_CONNECTION === 'true';
const dbFeatureImports = skipDb ? [] : [TypeOrmModule.forFeature([RecipeLikeEntity])];

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
  controllers: [RecipeLikesController],
  providers: [RecipeLikesService, JwtStrategy],
  exports: [RecipeLikesService],
})
export class RecipeLikesModule {}
