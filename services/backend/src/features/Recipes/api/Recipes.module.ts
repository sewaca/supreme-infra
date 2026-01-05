import { Module } from '@nestjs/common';
import { AuthModule } from '../../Auth/api/Auth.module';
import { RecipesService } from '../model/Recipes.service';
import { RecipesController } from './Recipes.controller';

@Module({
  imports: [AuthModule],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
