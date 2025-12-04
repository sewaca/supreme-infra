import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { RecipesService } from './Recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    // private readonly usersService: UsersService,
  ) {}

  @Get()
  public getRecipes(
    @Query('search') search?: string,
    @Query('ingredients') ingredients?: string,
  ): ReturnType<RecipesService['getRecipes']> {
    const ingredientsArray = ingredients
      ? ingredients.split(',').map((i) => i.trim())
      : undefined;

    return this.recipesService.getRecipes(search, ingredientsArray);
  }

  @Get(':id')
  public getRecipeById(
    @Param('id') id: string,
  ): ReturnType<RecipesService['getRecipeById']> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    try {
      return this.recipesService.getRecipeById(recipeId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Recipe not found') {
        throw new NotFoundException('Recipe not found');
      }
      throw error;
    }
  }

  // @Post(':id/like')
  // @UseGuards(JwtAuthGuard)
  // public async toggleRecipeLike(
  //   @Param('id') id: string,
  //   @Req() req: { user: { userId: number } },
  // ): Promise<{ liked: boolean; totalLikes: number }> {
  //   const recipeId = Number.parseInt(id, 10);

  //   if (Number.isNaN(recipeId)) {
  //     throw new BadRequestException('Invalid recipe id parameter');
  //   }

  //   try {
  //     this.recipesService.getRecipeById(recipeId);
  //   } catch (error) {
  //     if (error instanceof Error && error.message === 'Recipe not found') {
  //       throw new NotFoundException('Recipe not found');
  //     }
  //     throw error;
  //   }

  //   return this.usersService.toggleRecipeLike(req.user.userId, recipeId);
  // }
}
