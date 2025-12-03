import { Module } from '@nestjs/common';
import { AuthModule } from '../Auth/Auth.module';
import { RecipesController } from './Recipes.controller';
import { RecipesService } from './Recipes.service';

@Module({
  imports: [AuthModule],
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
