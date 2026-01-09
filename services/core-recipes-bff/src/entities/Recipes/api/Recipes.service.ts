import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProposedRecipeEntity } from '../model/ProposedRecipe.entity';
import { PublishedRecipeEntity } from '../model/PublishedRecipe.entity';
import type { RecipeDetailsDto, RecipeDto } from '../model/recipe.types';

const PROPOSED_ID_OFFSET = 100_000_000;

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(PublishedRecipeEntity)
    private readonly publishedRecipeRepository: Repository<PublishedRecipeEntity>,
    @InjectRepository(ProposedRecipeEntity)
    private readonly proposedRecipeRepository: Repository<ProposedRecipeEntity>,
  ) {}

  async getRecipes(searchQuery?: string, ingredients?: string[]): Promise<RecipeDto[]> {
    const queryBuilder = this.publishedRecipeRepository.createQueryBuilder('recipe');

    if (searchQuery?.trim()) {
      const query = `%${searchQuery.trim()}%`;
      queryBuilder.where('(recipe.title ILIKE :query OR recipe.description ILIKE :query)', { query });
    }

    if (ingredients && ingredients.length > 0) {
      const normalizedIngredients = ingredients.map((ing) => ing.trim()).filter((ing) => ing.length > 0);

      if (normalizedIngredients.length > 0) {
        for (const [index, ingredient] of normalizedIngredients.entries()) {
          const paramName = `ingredient${index}`;
          queryBuilder.andWhere(`:${paramName} = ANY(recipe.ingredients)`, {
            [paramName]: ingredient,
          });
        }
      }
    }

    const recipes = await queryBuilder.orderBy('recipe.created_at', 'DESC').getMany();

    return recipes.map((recipe) => this.mapToRecipeDto(recipe));
  }

  async getRecipeById(id: number): Promise<PublishedRecipeEntity> {
    const recipe = await this.publishedRecipeRepository.findOne({ where: { id } });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return recipe;
  }

  async createRecipe(
    recipeData: {
      title: string;
      description: string;
      ingredients: string[];
      cookingTime: number;
      difficulty: 'easy' | 'medium' | 'hard';
      imageUrl: string;
      servings: number;
      calories: number;
      detailedIngredients: Array<{ name: string; amount: string }>;
      steps: Array<{ stepNumber: number; instruction: string }>;
      author: string;
    },
    authorUserId?: number,
  ): Promise<PublishedRecipeEntity> {
    const instructions = recipeData.steps.map((step) => step.instruction).join('\n');

    const recipe = this.publishedRecipeRepository.create({
      title: recipeData.title,
      description: recipeData.description,
      ingredients: recipeData.ingredients,
      instructions,
      cookingTime: recipeData.cookingTime,
      difficulty: recipeData.difficulty,
      imageUrl: recipeData.imageUrl,
      servings: recipeData.servings,
      calories: recipeData.calories,
      detailedIngredients: recipeData.detailedIngredients,
      steps: recipeData.steps,
      author: recipeData.author,
      authorUserId: authorUserId || null,
    });

    return await this.publishedRecipeRepository.save(recipe);
  }

  async updateRecipe(
    id: number,
    recipeData: {
      title: string;
      description: string;
      ingredients: string[];
      cookingTime: number;
      difficulty: 'easy' | 'medium' | 'hard';
      imageUrl: string;
      servings: number;
      calories: number;
      detailedIngredients: Array<{ name: string; amount: string }>;
      steps: Array<{ stepNumber: number; instruction: string }>;
      author: string;
    },
  ): Promise<PublishedRecipeEntity> {
    const recipe = await this.getRecipeById(id);
    const instructions = recipeData.steps.map((step) => step.instruction).join('\n');

    recipe.title = recipeData.title;
    recipe.description = recipeData.description;
    recipe.ingredients = recipeData.ingredients;
    recipe.instructions = instructions;
    recipe.cookingTime = recipeData.cookingTime;
    recipe.difficulty = recipeData.difficulty;
    recipe.imageUrl = recipeData.imageUrl;
    recipe.servings = recipeData.servings;
    recipe.calories = recipeData.calories;
    recipe.detailedIngredients = recipeData.detailedIngredients;
    recipe.steps = recipeData.steps;
    recipe.author = recipeData.author;

    return await this.publishedRecipeRepository.save(recipe);
  }

  async deleteRecipe(id: number): Promise<void> {
    const recipe = await this.getRecipeById(id);
    await this.publishedRecipeRepository.remove(recipe);
  }

  mapToRecipeDto(recipe: PublishedRecipeEntity): RecipeDto {
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
    };
  }

  mapToRecipeDetailsDto(
    recipe: PublishedRecipeEntity,
    likes: number,
    comments: RecipeDetailsDto['comments'],
  ): RecipeDetailsDto {
    return {
      ...this.mapToRecipeDto(recipe),
      detailedIngredients: recipe.detailedIngredients,
      steps: recipe.steps,
      author: recipe.author,
      likes,
      comments,
    };
  }

  // Proposed recipes methods
  async getProposedRecipes(): Promise<RecipeDto[]> {
    const recipes = await this.proposedRecipeRepository.find({
      order: { submittedAt: 'DESC' },
    });

    return recipes.map((recipe) => this.mapProposedToRecipeDto(recipe));
  }

  async getProposedRecipeById(id: number): Promise<ProposedRecipeEntity> {
    const recipe = await this.proposedRecipeRepository.findOne({ where: { id } });

    if (!recipe) {
      throw new NotFoundException('Proposed recipe not found');
    }

    return recipe;
  }

  async proposeRecipe(
    recipeData: {
      title: string;
      description: string;
      ingredients: string[];
      cookingTime: number;
      difficulty: 'easy' | 'medium' | 'hard';
      imageUrl: string;
      servings: number;
      calories: number;
      detailedIngredients: Array<{ name: string; amount: string }>;
      steps: Array<{ stepNumber: number; instruction: string }>;
      author: string;
    },
    authorUserId?: number,
  ): Promise<number> {
    const instructions = recipeData.steps.map((step) => step.instruction).join('\n');

    // Get the next ID with offset
    const maxIdResult = await this.proposedRecipeRepository
      .createQueryBuilder('recipe')
      .select('MAX(recipe.id)', 'maxId')
      .getRawOne();

    const nextId = maxIdResult?.maxId ? maxIdResult.maxId + 1 : PROPOSED_ID_OFFSET + 1;

    const recipe = this.proposedRecipeRepository.create({
      id: nextId,
      title: recipeData.title,
      description: recipeData.description,
      ingredients: recipeData.ingredients,
      instructions,
      cookingTime: recipeData.cookingTime,
      difficulty: recipeData.difficulty,
      imageUrl: recipeData.imageUrl,
      servings: recipeData.servings,
      calories: recipeData.calories,
      detailedIngredients: recipeData.detailedIngredients,
      steps: recipeData.steps,
      author: recipeData.author,
      authorUserId: authorUserId || null,
    });

    const savedRecipe = await this.proposedRecipeRepository.save(recipe);
    return savedRecipe.id;
  }

  async updateProposedRecipe(
    id: number,
    recipeData: {
      title: string;
      description: string;
      ingredients: string[];
      cookingTime: number;
      difficulty: 'easy' | 'medium' | 'hard';
      imageUrl: string;
      servings: number;
      calories: number;
      detailedIngredients: Array<{ name: string; amount: string }>;
      steps: Array<{ stepNumber: number; instruction: string }>;
      author: string;
    },
  ): Promise<ProposedRecipeEntity> {
    const recipe = await this.getProposedRecipeById(id);
    const instructions = recipeData.steps.map((step) => step.instruction).join('\n');

    recipe.title = recipeData.title;
    recipe.description = recipeData.description;
    recipe.ingredients = recipeData.ingredients;
    recipe.instructions = instructions;
    recipe.cookingTime = recipeData.cookingTime;
    recipe.difficulty = recipeData.difficulty;
    recipe.imageUrl = recipeData.imageUrl;
    recipe.servings = recipeData.servings;
    recipe.calories = recipeData.calories;
    recipe.detailedIngredients = recipeData.detailedIngredients;
    recipe.steps = recipeData.steps;
    recipe.author = recipeData.author;

    return await this.proposedRecipeRepository.save(recipe);
  }

  async publishRecipe(id: number): Promise<number> {
    const proposedRecipe = await this.getProposedRecipeById(id);

    const publishedRecipe = await this.createRecipe(
      {
        title: proposedRecipe.title,
        description: proposedRecipe.description,
        ingredients: proposedRecipe.ingredients,
        cookingTime: proposedRecipe.cookingTime,
        difficulty: proposedRecipe.difficulty,
        imageUrl: proposedRecipe.imageUrl,
        servings: proposedRecipe.servings,
        calories: proposedRecipe.calories,
        detailedIngredients: proposedRecipe.detailedIngredients,
        steps: proposedRecipe.steps,
        author: proposedRecipe.author,
      },
      proposedRecipe.authorUserId || undefined,
    );

    await this.proposedRecipeRepository.remove(proposedRecipe);

    return publishedRecipe.id;
  }

  async deleteProposedRecipe(id: number): Promise<void> {
    const recipe = await this.getProposedRecipeById(id);
    await this.proposedRecipeRepository.remove(recipe);
  }

  private mapProposedToRecipeDto(recipe: ProposedRecipeEntity): RecipeDto {
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
    };
  }
}
