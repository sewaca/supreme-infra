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
import { ProposedRecipeEntity } from '../model/ProposedRecipe.entity';
import { PublishedRecipeEntity } from '../model/PublishedRecipe.entity';

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
    // Check if id is in format "proposed:123"
    const isProposed = id.startsWith('proposed:');
    const numericId = isProposed ? id.replace('proposed:', '') : id;
    const recipeId = Number.parseInt(numericId, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    // Fetch from proposed or published based on prefix
    const recipe = isProposed
      ? await this.recipesService.getProposedRecipeById(recipeId)
      : await this.recipesService.getRecipeById(recipeId);

    const totalLikes = await this.recipeLikesService.getRecipeLikesCount(recipeId);
    const comments = await this.commentsService.getRecipeComments(recipeId);

    const mappedComments = comments.map((comment) => ({
      id: comment.id,
      author: comment.author,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      rating: comment.rating,
    }));

    // Map proposed recipe to details DTO if needed
    const recipeDetails = isProposed
      ? this.mapProposedToDetailsDto(recipe as ProposedRecipeEntity, totalLikes, mappedComments)
      : this.recipesService.mapToRecipeDetailsDto(recipe as PublishedRecipeEntity, totalLikes, mappedComments);

    if (req.user?.id) {
      const isLiked = await this.recipeLikesService.isRecipeLikedByUser(req.user.id, recipeId);
      return { ...recipeDetails, isLiked };
    }

    return recipeDetails;
  }

  private mapProposedToDetailsDto(
    recipe: ProposedRecipeEntity,
    likes: number,
    comments: RecipeDetailsDto['comments'],
  ): RecipeDetailsDto {
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      cookingTime: recipe.cookingTime,
      difficulty: recipe.difficulty,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      calories: recipe.calories,
      detailedIngredients: recipe.detailedIngredients,
      steps: recipe.steps,
      author: recipe.author,
      likes,
      comments,
    };
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
    // Check if id is in format "proposed:123"
    const isProposed = id.startsWith('proposed:');
    const numericId = isProposed ? id.replace('proposed:', '') : id;
    const recipeId = Number.parseInt(numericId, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    if (isProposed) {
      // Update proposed recipe
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
    } else {
      // Update published recipe
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
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @HttpCode(HttpStatus.OK)
  public async deleteRecipe(@Param('id') id: string): Promise<{ success: boolean }> {
    // Check if id is in format "proposed:123"
    const isProposed = id.startsWith('proposed:');
    const numericId = isProposed ? id.replace('proposed:', '') : id;
    const recipeId = Number.parseInt(numericId, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    if (isProposed) {
      await this.recipesService.deleteProposedRecipe(recipeId);
    } else {
      await this.recipesService.deleteRecipe(recipeId);
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

  @Post('proposed/submit')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(submitRecipeSchema))
  public async submitRecipe(@Body() dto: SubmitRecipeDto): Promise<{ success: boolean; id: string }> {
    const id = await this.recipesService.submitRecipe(dto);
    return { success: true, id: `proposed:${id}` };
  }

  @Post('proposed/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @HttpCode(HttpStatus.OK)
  public async publishRecipe(@Param('id') id: string): Promise<{ id: number }> {
    // Remove "proposed:" prefix if present
    const numericId = id.startsWith('proposed:') ? id.replace('proposed:', '') : id;
    const recipeId = Number.parseInt(numericId, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    const publishedId = await this.recipesService.publishRecipe(recipeId);
    return { id: publishedId };
  }
}
