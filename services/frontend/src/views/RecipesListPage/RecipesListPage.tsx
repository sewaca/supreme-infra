'use client';

import Link from 'next/link';
import { RecipeCard } from '../../entities/recipe/RecipeCard';
import type { Recipe } from '../../shared/api/backendApi.types';
import { getUserRole } from '../../shared/lib/auth.client';
import { RecipeFilters } from '../../widgets/RecipeFilters/RecipeFilters';
import styles from './RecipesListPage.module.css';

interface RecipesListPageProps {
  recipes: Recipe[];
  searchQuery?: string;
  selectedIngredients?: string[];
}

export function RecipesListPage({
  recipes,
  searchQuery,
  selectedIngredients,
}: RecipesListPageProps) {
  const userRole = getUserRole();
  const isModeratorOrAdmin = userRole === 'moderator' || userRole === 'admin';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Рецепты</h1>
        <p className={styles.subtitle}>
          Найдите идеальный рецепт для вашего стола
        </p>
      </header>

      <div className={styles.actions}>
        <Link href="/submit-recipe" className={styles.submitButton}>
          Предложить рецепт
        </Link>
        {isModeratorOrAdmin && (
          <Link href="/proposed-recipes" className={styles.proposedButton}>
            Посмотреть предложенные рецепты
          </Link>
        )}
      </div>

      <RecipeFilters
        initialSearch={searchQuery}
        initialIngredients={selectedIngredients}
      />

      <div className={styles.recipesGrid}>
        {recipes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {searchQuery || selectedIngredients?.length
                ? 'Рецепты не найдены по заданным критериям. Попробуйте изменить параметры поиска.'
                : 'Рецепты не найдены'}
            </p>
          </div>
        ) : (
          recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  );
}
