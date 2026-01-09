import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { RecipeLikesService } from '../../../features/RecipeLikes/api/RecipeLikes.service';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';
import { CommentsService } from '../../Comments/api/Comments.service';
import { type SubmitRecipeDto, submitRecipeSchema } from '../model/recipe.schemas';
import type { RecipeDetailsDto, RecipeDto } from '../model/recipe.types';
import { RecipesService } from './Recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly recipeLikesService: RecipeLikesService,
    private readonly commentsService: CommentsService,
  ) {}

  @Get()
  public async getRecipes(
    @Query('search') search?: string,
    @Query('ingredients') ingredients?: string,
  ): Promise<RecipeDto[]> {
    const ingredientsArray = ingredients ? ingredients.split(',').map((i) => i.trim()) : undefined;
    return this.recipesService.getRecipes(search, ingredientsArray);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  public async getRecipeById(
    @Param('id') id: string,
    @Request() req: { user?: { id: number; role: string } },
  ): Promise<RecipeDetailsDto & { isLiked?: boolean }> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    const recipe = await this.recipesService.getRecipeById(recipeId);
    const totalLikes = await this.recipeLikesService.getRecipeLikesCount(recipeId);
    const comments = await this.commentsService.getRecipeComments(recipeId);

    const mappedComments = comments.map((comment) => ({
      id: comment.id,
      author: comment.author,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      rating: comment.rating,
    }));

    const recipeDetails = this.recipesService.mapToRecipeDetailsDto(recipe, totalLikes, mappedComments);

    if (req.user?.id) {
      const isLiked = await this.recipeLikesService.isRecipeLikedByUser(req.user.id, recipeId);
      return { ...recipeDetails, isLiked };
    }

    return recipeDetails;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(submitRecipeSchema))
  public async updateRecipe(
    @Param('id') id: string,
    @Body() dto: SubmitRecipeDto,
  ): Promise<RecipeDetailsDto | RecipeDto> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    // Try to update published recipe first
    try {
      const updated = await this.recipesService.updateRecipe(recipeId, dto);
      const totalLikes = await this.recipeLikesService.getRecipeLikesCount(recipeId);
      const comments = await this.commentsService.getRecipeComments(recipeId);

      const mappedComments = comments.map((comment) => ({
        id: comment.id,
        author: comment.author,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        rating: comment.rating,
      }));

      return this.recipesService.mapToRecipeDetailsDto(updated, totalLikes, mappedComments);
    } catch {
      // If not found in published, try proposed
      const updated = await this.recipesService.updateProposedRecipe(recipeId, dto);
      return {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        ingredients: updated.ingredients,
        instructions: updated.instructions,
        cookingTime: updated.cookingTime,
        difficulty: updated.difficulty,
        imageUrl: updated.imageUrl,
        servings: updated.servings,
        calories: updated.calories,
      };
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @HttpCode(HttpStatus.OK)
  public async deleteRecipe(@Param('id') id: string): Promise<{ success: boolean }> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    // Try to delete from published first, then from proposed
    try {
      await this.recipesService.deleteRecipe(recipeId);
    } catch {
      await this.recipesService.deleteProposedRecipe(recipeId);
    }

    return { success: true };
  }

  // Proposed recipes endpoints
  @Get('proposed/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  public async getProposedRecipes(): Promise<RecipeDto[]> {
    return this.recipesService.getProposedRecipes();
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(submitRecipeSchema))
  public async submitRecipe(@Body() dto: SubmitRecipeDto): Promise<{ success: boolean; id: number }> {
    const id = await this.recipesService.submitRecipe(dto);
    return { success: true, id };
  }

  @Post('proposed/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @HttpCode(HttpStatus.OK)
  public async publishRecipe(@Param('id') id: string): Promise<{ id: number }> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    const publishedId = await this.recipesService.publishRecipe(recipeId);
    return { id: publishedId };
  }
}
