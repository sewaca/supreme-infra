import { z } from 'zod';

export const submitRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  ingredients: z.array(z.string().min(1, 'Ingredient cannot be empty')).min(1, 'At least one ingredient is required'),
  cookingTime: z.number().int('Cooking time must be an integer').positive('Cooking time must be positive'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    message: 'Difficulty must be easy, medium, or hard',
  }),
  imageUrl: z.string().url('Image URL must be a valid URL'),
  servings: z.number().int('Servings must be an integer').positive('Servings must be positive'),
  calories: z.number().int('Calories must be an integer').nonnegative('Calories cannot be negative'),
  detailedIngredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Ingredient name is required'),
        amount: z.string().min(1, 'Ingredient amount is required'),
      }),
    )
    .min(1, 'At least one detailed ingredient is required'),
  steps: z
    .array(
      z.object({
        stepNumber: z.number().int('Step number must be an integer').positive('Step number must be positive'),
        instruction: z.string().min(1, 'Instruction is required'),
      }),
    )
    .min(1, 'At least one step is required'),
  author: z.string().min(1, 'Author is required'),
});

export type SubmitRecipeDto = z.infer<typeof submitRecipeSchema>;
