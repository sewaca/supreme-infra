import { Injectable } from '@nestjs/common';

export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface RecipeComment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  rating: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl: string;
  servings: number;
  calories: number;
}

export interface RecipeDetails extends Recipe {
  detailedIngredients: RecipeIngredient[];
  steps: RecipeStep[];
  servings: number;
  calories: number;
  author: string;
  likes: number;
  comments: RecipeComment[];
}

@Injectable()
export class RecipesService {
  public getRecipes(_searchQuery?: string, _ingredients?: string[]): Recipe[] {
    const recipe: Recipe = {
      id: 1,
      title: 'Lorem Ipsum Dish',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      ingredients: ['Lorem', 'Ipsum', 'Dolor', 'Sit', 'Amet'],
      instructions:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      cookingTime: 30,
      difficulty: 'easy',
      imageUrl: 'https://placehold.co/2000x1000',
      servings: 4,
      calories: 320,
    };

    return [recipe];
  }

  public getRecipeById(id: number): RecipeDetails {
    if (id !== 1) {
      throw new Error('Recipe not found');
    }

    return {
      id: 1,
      title: 'Lorem Ipsum Culinary Masterpiece',
      description:
        '**Lorem ipsum** dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      ingredients: ['Lorem', 'Ipsum', 'Dolor', 'Sit', 'Amet'],
      instructions: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      cookingTime: 45,
      difficulty: 'medium',
      imageUrl: 'https://placehold.co/2000x1000',
      detailedIngredients: [
        { name: 'Lorem powder', amount: '200g' },
        { name: 'Ipsum extract', amount: '3 tbsp' },
        { name: 'Dolor chunks', amount: '150g' },
        { name: 'Sit seasoning', amount: '1 tsp' },
        { name: 'Amet garnish', amount: 'to taste' },
      ],
      steps: [
        {
          stepNumber: 1,
          instruction:
            '**Prepare the base:** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Preheat your oven to 180°C (350°F).',
        },
        {
          stepNumber: 2,
          instruction:
            '**Mix ingredients:** Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Combine all dry ingredients in a large bowl.',
        },
        {
          stepNumber: 3,
          instruction:
            '**Add liquids:** Ut enim ad minim veniam, quis nostrud exercitation. Gradually add wet ingredients while stirring continuously.',
        },
        {
          stepNumber: 4,
          instruction:
            '**Cook:** Ullamco laboris nisi ut aliquip ex ea commodo consequat. Place in preheated oven for 30-35 minutes.',
        },
        {
          stepNumber: 5,
          instruction:
            '**Serve:** Duis aute irure dolor in reprehenderit in voluptate velit. Let cool for 5 minutes before serving with garnish.',
        },
      ],
      servings: 4,
      calories: 320,
      author: 'Chef Lorem Ipsum',
      likes: 42,
      comments: [
        {
          id: 1,
          author: 'John Doe',
          content:
            '**Amazing recipe!** Lorem ipsum dolor sit amet. I made this last night and it was *delicious*.',
          createdAt: '2024-12-01T10:30:00Z',
          rating: 5,
        },
        {
          id: 2,
          author: 'Jane Smith',
          content:
            'Good recipe, but I would suggest:\n\n- Adding more seasoning\n- Cooking for 5 minutes longer\n\nOverall great though!',
          createdAt: '2024-12-02T14:20:00Z',
          rating: 4,
        },
        {
          id: 3,
          author: 'Bob Wilson',
          content:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. This is now my *go-to recipe* for weeknight dinners!',
          createdAt: '2024-12-03T09:15:00Z',
          rating: 5,
        },
      ],
    };
  }
}
