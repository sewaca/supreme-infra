import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../../../shared/guards/jwt.strategy';
import { RecipeLikeEntity } from '../model/RecipeLike.entity';
import { RecipeLikesService } from '../model/RecipeLikes.service';
import { RecipesService } from '../model/Recipes.service';
import { RecipesController } from './Recipes.controller';

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
  controllers: [RecipesController],
  providers: [RecipesService, RecipeLikesService, JwtStrategy],
  exports: [RecipesService, RecipeLikesService, JwtStrategy, PassportModule],
})
export class RecipesModule {}
