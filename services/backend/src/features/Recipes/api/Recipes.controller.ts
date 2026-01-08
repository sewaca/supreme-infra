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
  UsePipes,
} from '@nestjs/common';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';
import { RecipeLikesService } from '../model/RecipeLikes.service';
import { type RecipeDetails, RecipesService } from '../model/Recipes.service';
import { type SubmitRecipeDto, submitRecipeSchema } from '../model/recipe.schemas';

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly recipeLikesService: RecipeLikesService,
  ) {}

  @Get()
  public getRecipes(
    @Query('search') search?: string,
    @Query('ingredients') ingredients?: string,
  ): ReturnType<RecipesService['getRecipes']> {
    const ingredientsArray = ingredients ? ingredients.split(',').map((i) => i.trim()) : undefined;

    return this.recipesService.getRecipes(search, ingredientsArray);
  }

  @Get('proposed/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  public getProposedRecipes(): ReturnType<RecipesService['getProposedRecipes']> {
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
    const isModeratorOrAdmin = req.user?.role === 'moderator' || req.user?.role === 'admin';

    if (isProposed && !isModeratorOrAdmin) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    try {
      const recipe = this.recipesService.getRecipeById(recipeId, isProposed);
      const totalLikes = await this.recipeLikesService.getRecipeLikesCount(recipeId);
      const updatedRecipe = { ...recipe, likes: totalLikes };

      if (req.user?.id) {
        const isLiked = await this.recipeLikesService.isRecipeLikedByUser(req.user.id, recipeId);
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
  public publishRecipe(@Param('id') id: string): ReturnType<RecipesService['publishRecipe']> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    try {
      return this.recipesService.publishRecipe(recipeId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Proposed recipe not found') {
        throw new NotFoundException('Proposed recipe not found');
      }
      throw error;
    }
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(submitRecipeSchema))
  public submitRecipe(@Body() dto: SubmitRecipeDto): {
    success: boolean;
    id: number;
  } {
    const id = this.recipesService.submitRecipe(dto);
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

    return this.recipeLikesService.toggleRecipeLike(req.user.id, recipeId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(submitRecipeSchema))
  public updateRecipe(@Param('id') id: string, @Body() dto: SubmitRecipeDto): RecipeDetails {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    try {
      return this.recipesService.updateRecipe(recipeId, dto);
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
