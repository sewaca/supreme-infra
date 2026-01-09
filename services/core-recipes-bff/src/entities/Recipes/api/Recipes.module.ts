import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeLikesModule } from '../../../features/RecipeLikes/api/RecipeLikes.module';
import { JwtStrategy } from '../../../shared/guards/jwt.strategy';
import { CommentsModule } from '../../Comments/api/Comments.module';
import { ProposedRecipeEntity } from '../model/ProposedRecipe.entity';
import { PublishedRecipeEntity } from '../model/PublishedRecipe.entity';
import { RecipesController } from './Recipes.controller';
import { RecipesService } from './Recipes.service';

const skipDb = process.env.SKIP_DB_CONNECTION === 'true';
const dbFeatureImports = skipDb ? [] : [TypeOrmModule.forFeature([PublishedRecipeEntity, ProposedRecipeEntity])];

@Module({
  imports: [
    ...dbFeatureImports,
    RecipeLikesModule,
    CommentsModule,
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
  providers: [RecipesService, JwtStrategy],
  exports: [RecipesService],
})
export class RecipesModule {}
