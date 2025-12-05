import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { Roles } from '../Auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard';
import { RolesGuard } from '../Auth/guards/roles.guard';
import { UsersService } from '../Auth/Users.service';
import { RecipeDetails, RecipesService } from './Recipes.service';

const submitRecipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  ingredients: z.array(z.string().min(1)).min(1),
  cookingTime: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  imageUrl: z.string().url(),
  servings: z.number().int().positive(),
  calories: z.number().int().nonnegative(),
  detailedIngredients: z
    .array(z.object({ name: z.string().min(1), amount: z.string().min(1) }))
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
    private readonly usersService: UsersService,
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

  @Get('proposed/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  public getProposedRecipes(): ReturnType<
    RecipesService['getProposedRecipes']
  > {
    return this.recipesService.getProposedRecipes();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  public async getRecipeById(
    @Param('id') id: string,
    @Request() req: { user?: { id: number; role: string } },
  ): Promise<RecipeDetails & { isLiked?: boolean }> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    const isProposed = recipeId >= 1_000_000;
    const isModeratorOrAdmin =
      req.user?.role === 'moderator' || req.user?.role === 'admin';

    if (isProposed && !isModeratorOrAdmin) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    try {
      const recipe = this.recipesService.getRecipeById(recipeId, isProposed);
      const totalLikes = await this.usersService.getRecipeLikesCount(recipeId);
      const updatedRecipe = { ...recipe, likes: totalLikes };

      if (req.user?.id) {
        const isLiked = await this.usersService.isRecipeLikedByUser(
          req.user.id,
          recipeId,
        );
        return { ...updatedRecipe, isLiked };
      }
      return updatedRecipe;
    } catch (error) {
      if (error instanceof Error && error.message === 'Recipe not found') {
        throw new NotFoundException('Recipe not found');
      }
      throw error;
    }
  }

  @Post('proposed/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @HttpCode(HttpStatus.OK)
  public publishRecipe(
    @Param('id') id: string,
  ): ReturnType<RecipesService['publishRecipe']> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    try {
      return this.recipesService.publishRecipe(recipeId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Proposed recipe not found'
      ) {
        throw new NotFoundException('Proposed recipe not found');
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

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  public async toggleRecipeLike(
    @Param('id') id: string,
    @Request() req: {
      user: { id: number; email: string; name: string; role: string };
    },
  ): Promise<{ liked: boolean; totalLikes: number }> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    try {
      const isProposed = recipeId >= 1_000_000;
      this.recipesService.getRecipeById(recipeId, isProposed);
    } catch (error) {
      if (error instanceof Error && error.message === 'Recipe not found') {
        throw new NotFoundException('Recipe not found');
      }
      throw error;
    }

    return this.usersService.toggleRecipeLike(req.user.id, recipeId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @HttpCode(HttpStatus.OK)
  public updateRecipe(
    @Param('id') id: string,
    @Body() body: unknown,
  ): RecipeDetails {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    const validationResult = submitRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestException('Invalid recipe format');
    }

    try {
      return this.recipesService.updateRecipe(recipeId, validationResult.data);
    } catch (error) {
      if (error instanceof Error && error.message === 'Recipe not found') {
        throw new NotFoundException('Recipe not found');
      }
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @HttpCode(HttpStatus.OK)
  public deleteRecipe(@Param('id') id: string): { success: boolean } {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    try {
      this.recipesService.deleteRecipe(recipeId);
      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.message === 'Recipe not found') {
        throw new NotFoundException('Recipe not found');
      }
      throw error;
    }
  }
}
