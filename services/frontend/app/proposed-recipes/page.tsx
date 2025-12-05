import { redirect } from 'next/navigation';
import { Recipe, serverApi } from '../../src/shared/api/backendApi';
import { getAuthToken, getUser } from '../../src/shared/lib/auth.server';
import { ProposedRecipesPage } from '../../src/views/ProposedRecipesPage/ProposedRecipesPage';

export default async function ProposedRecipesPageRoute() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'moderator' && user.role !== 'admin') {
    redirect('/');
  }

  const token = await getAuthToken();
  if (!token) {
    redirect('/login');
  }

  let recipes: Recipe[];
  try {
    recipes = await serverApi.getProposedRecipes(token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login');
    }
    throw error;
  }

  return <ProposedRecipesPage recipes={recipes} />;
}
