import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { RecipesService } from './Recipes.service';

const submitRecipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z.string().min(1),
  cookingTime: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  imageUrl: z.string().url(),
  servings: z.number().int().positive(),
  calories: z.number().int().nonnegative(),
  detailedIngredients: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: z.string().min(1),
      }),
    )
    .min(1),
  steps: z
    .array(
      z.object({
        stepNumber: z.number().int().positive(),
        instruction: z.string().min(1),
      }),
    )
    .min(1),
  author: z.string().min(1),
});

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

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  public submitRecipe(@Body() body: unknown): { success: boolean; id: number } {
    const validationResult = submitRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestException('Invalid recipe format');
    }

    const id = this.recipesService.submitRecipe(validationResult.data);
    return { success: true, id };
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
