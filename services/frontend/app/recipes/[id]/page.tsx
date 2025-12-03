import { notFound, redirect } from 'next/navigation';
import { backendApi, RecipeDetails } from '../../../src/shared/api/backendApi';
import { getUser } from '../../../src/shared/lib/auth.server';
import { RecipeDetailsPage } from '../../../src/views/RecipeDetailsPage/RecipeDetailsPage';

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const recipeId = Number.parseInt(id, 10);

  if (Number.isNaN(recipeId)) {
    notFound();
  }

  let recipe: RecipeDetails;
  try {
    recipe = await backendApi.getRecipeById(recipeId);
  } catch (error) {
    if (error instanceof Error && error.message === 'Recipe not found') {
      notFound();
    }
    throw error;
  }

  return <RecipeDetailsPage recipe={recipe} />;
}
