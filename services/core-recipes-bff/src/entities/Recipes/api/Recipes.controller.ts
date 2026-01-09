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
import { JwtAuthGuard, Roles, RolesGuard, ZodValidationPipe } from '@supreme-int/nestjs-shared';
import { RecipeLikesService } from '../../../features/RecipeLikes/api/RecipeLikes.service';
import { CommentsService } from '../../Comments/api/Comments.service';
import { ProposedRecipeEntity } from '../model/ProposedRecipe.entity';
import { PublishedRecipeEntity } from '../model/PublishedRecipe.entity';
import { type SubmitRecipeDto, submitRecipeSchema } from '../model/recipe.schemas';
import type { RecipeDetailsDto, RecipeDto } from '../model/recipe.types';
import { RecipesService } from './Recipes.service';

const PROPOSED_ID_OFFSET = 100_000_000;

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

    // Check if ID is proposed (>= 100_000_000)
    const isProposed = recipeId >= PROPOSED_ID_OFFSET;

    // Fetch from proposed or published based on ID
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

    // Map recipe to details DTO
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
  public async updateRecipe(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(submitRecipeSchema)) dto: SubmitRecipeDto,
  ): Promise<RecipeDetailsDto | RecipeDto> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    // Check if ID is proposed (>= 100_000_000)
    const isProposed = recipeId >= PROPOSED_ID_OFFSET;

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
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    // Check if ID is proposed (>= 100_000_000)
    const isProposed = recipeId >= PROPOSED_ID_OFFSET;

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

  @Post('propose')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(submitRecipeSchema))
  public async proposeRecipe(@Body() dto: SubmitRecipeDto): Promise<{ success: boolean; id: number }> {
    const id = await this.recipesService.proposeRecipe(dto);
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
