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
    const actualId = isProposed ? recipeId - PROPOSED_ID_OFFSET : recipeId;

    // Fetch from proposed or published based on ID
    const recipe = isProposed
      ? await this.recipesService.getProposedRecipeById(actualId)
      : await this.recipesService.getRecipeById(actualId);

    const totalLikes = await this.recipeLikesService.getRecipeLikesCount(actualId);
    const comments = await this.commentsService.getRecipeComments(actualId);

    const mappedComments = comments.map((comment) => ({
      id: comment.id,
      author: comment.author,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      rating: comment.rating,
    }));

    // Map proposed recipe to details DTO if needed
    const recipeDetails = isProposed
      ? this.mapProposedToDetailsDto(recipe as ProposedRecipeEntity, recipeId, totalLikes, mappedComments)
      : this.recipesService.mapToRecipeDetailsDto(recipe as PublishedRecipeEntity, totalLikes, mappedComments);

    if (req.user?.id) {
      const isLiked = await this.recipeLikesService.isRecipeLikedByUser(req.user.id, actualId);
      return { ...recipeDetails, isLiked };
    }

    return recipeDetails;
  }

  private mapProposedToDetailsDto(
    recipe: ProposedRecipeEntity,
    displayId: number,
    likes: number,
    comments: RecipeDetailsDto['comments'],
  ): RecipeDetailsDto {
    return {
      id: displayId, // Use the offset ID for display
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
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    // Check if ID is proposed (>= 100_000_000)
    const isProposed = recipeId >= PROPOSED_ID_OFFSET;
    const actualId = isProposed ? recipeId - PROPOSED_ID_OFFSET : recipeId;

    if (isProposed) {
      // Update proposed recipe
      const updated = await this.recipesService.updateProposedRecipe(actualId, dto);
      return {
        id: updated.id + PROPOSED_ID_OFFSET, // Return with offset
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
      const updated = await this.recipesService.updateRecipe(actualId, dto);
      const totalLikes = await this.recipeLikesService.getRecipeLikesCount(actualId);
      const comments = await this.commentsService.getRecipeComments(actualId);

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
    const actualId = isProposed ? recipeId - PROPOSED_ID_OFFSET : recipeId;

    if (isProposed) {
      await this.recipesService.deleteProposedRecipe(actualId);
    } else {
      await this.recipesService.deleteRecipe(actualId);
    }

    return { success: true };
  }

  // Proposed recipes endpoints
  @Get('proposed/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  public async getProposedRecipes(): Promise<RecipeDto[]> {
    const recipes = await this.recipesService.getProposedRecipes();
    // Add offset to all IDs
    return recipes.map((recipe) => ({
      ...recipe,
      id: recipe.id + PROPOSED_ID_OFFSET,
    }));
  }

  @Post('proposed/submit')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(submitRecipeSchema))
  public async submitRecipe(@Body() dto: SubmitRecipeDto): Promise<{ success: boolean; id: number }> {
    const id = await this.recipesService.submitRecipe(dto);
    return { success: true, id: id + PROPOSED_ID_OFFSET };
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

    // Check if ID has offset, remove it
    const actualId = recipeId >= PROPOSED_ID_OFFSET ? recipeId - PROPOSED_ID_OFFSET : recipeId;

    const publishedId = await this.recipesService.publishRecipe(actualId);
    return { id: publishedId };
  }
}
