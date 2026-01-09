// import * as fs from 'node:fs';
// import * as path from 'node:path';

// interface RecipeIngredient {
//   name: string;
//   amount: string;
// }

// interface RecipeStep {
//   stepNumber: number;
//   instruction: string;
// }

// interface RecipeComment {
//   id: number;
//   author: string;
//   content: string;
//   createdAt: string;
//   rating: number;
// }

// interface Recipe {
//   id: number;
//   title: string;
//   description: string;
//   ingredients: string[];
//   instructions: string;
//   cookingTime: number;
//   difficulty: 'easy' | 'medium' | 'hard';
//   imageUrl: string;
//   servings: number;
//   calories: number;
//   detailedIngredients: RecipeIngredient[];
//   steps: RecipeStep[];
//   author: string;
//   likes: number;
//   comments: RecipeComment[];
// }

// function escapeSql(value: string): string {
//   return value.replace(/'/g, "''").replace(/\\/g, '\\\\');
// }

// function generateRecipeInsert(recipe: Recipe): string {
//   const ingredientsArray = `ARRAY[${recipe.ingredients.map((ing) => `'${escapeSql(ing)}'`).join(', ')}]`;
//   const detailedIngredientsJson = JSON.stringify(recipe.detailedIngredients).replace(/'/g, "''");
//   const stepsJson = JSON.stringify(recipe.steps).replace(/'/g, "''");

//   return `INSERT INTO published_recipes (
//   id, title, description, ingredients, instructions, cooking_time, difficulty,
//   image_url, servings, calories, detailed_ingredients, steps, author, author_user_id, created_at
// ) VALUES (
//   ${recipe.id},
//   '${escapeSql(recipe.title)}',
//   '${escapeSql(recipe.description)}',
//   ${ingredientsArray},
//   '${escapeSql(recipe.instructions)}',
//   ${recipe.cookingTime},
//   '${recipe.difficulty}',
//   '${escapeSql(recipe.imageUrl)}',
//   ${recipe.servings},
//   ${recipe.calories},
//   '${detailedIngredientsJson}'::jsonb,
//   '${stepsJson}'::jsonb,
//   '${escapeSql(recipe.author)}',
//   NULL,
//   NOW()
// );`;
// }

// function generateCommentInsert(comment: RecipeComment, recipeId: number): string {
//   return `INSERT INTO recipe_comments (recipe_id, author, content, rating, author_user_id, created_at) VALUES (${recipeId}, '${escapeSql(comment.author)}', '${escapeSql(comment.content)}', ${comment.rating}, NULL, '${comment.createdAt}');`;
// }

// function main() {
//   const mockFilePath = path.join(__dirname, '../../../services/backend/src/shared/recipes-mock.json');
//   const outputFilePath = path.join(__dirname, 'migration-data.sql');

//   const recipes: Recipe[] = JSON.parse(fs.readFileSync(mockFilePath, 'utf-8'));

//   let sql = `-- Migration data for recipes
// -- Generated from recipes-mock.json
// -- This file contains INSERT statements for published_recipes and recipe_comments tables

// `;

//   sql += '-- Insert published recipes\n';
//   for (const recipe of recipes) {
//     sql += generateRecipeInsert(recipe) + '\n\n';
//   }

//   sql += '\n-- Insert recipe comments\n';
//   for (const recipe of recipes) {
//     if (recipe.comments && recipe.comments.length > 0) {
//       for (const comment of recipe.comments) {
//         sql += generateCommentInsert(comment, recipe.id) + '\n';
//       }
//       sql += '\n';
//     }
//   }

//   sql += '\n-- Reset sequence for published_recipes\n';
//   sql += `SELECT setval('published_recipes_id_seq', (SELECT MAX(id) FROM published_recipes));\n`;

//   fs.writeFileSync(outputFilePath, sql, 'utf-8');

//   console.log(`✅ Migration SQL generated: ${outputFilePath}`);
//   console.log(`   Total recipes: ${recipes.length}`);
//   console.log(`   Total comments: ${recipes.reduce((sum, r) => sum + (r.comments?.length || 0), 0)}`);
// }

// main();
