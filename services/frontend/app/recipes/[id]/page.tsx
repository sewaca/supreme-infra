import { notFound, redirect } from 'next/navigation';
import { RecipeDetails, serverApi } from '../../../src/shared/api/backendApi';
import { getAuthToken, getUser } from '../../../src/shared/lib/auth.server';
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

  const token = await getAuthToken();
  if (!token) {
    redirect('/login');
  }

  const isModeratorOrAdmin = user.role === 'moderator' || user.role === 'admin';

  let recipe: RecipeDetails;
  try {
    recipe = await serverApi.getRecipeById(recipeId, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Recipe not found') {
      notFound();
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login');
    }
    throw error;
  }

  const isProposed = recipeId >= 1_000_000;

  return (
    <RecipeDetailsPage
      recipe={recipe}
      isProposed={isProposed && isModeratorOrAdmin}
      isModeratorOrAdmin={isModeratorOrAdmin}
    />
  );
}
