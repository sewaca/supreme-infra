import { backendApi } from '../src/shared/api/backendApi';
import { RecipesListPage } from '../src/views/RecipesListPage/RecipesListPage';

interface HomeProps {
  searchParams: Promise<{ search?: string; ingredients?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const searchQuery = params.search;
  const ingredientsString = params.ingredients;
  const ingredientsArray = ingredientsString
    ? ingredientsString.split(',').map((i) => i.trim())
    : undefined;

  const recipes = await backendApi.getRecipes(searchQuery, ingredientsArray);

  return (
    <RecipesListPage
      recipes={recipes}
      searchQuery={searchQuery}
      selectedIngredients={ingredientsArray}
    />
  );
}
