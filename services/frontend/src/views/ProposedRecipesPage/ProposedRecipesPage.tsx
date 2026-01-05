'use client';

import { RecipeCard } from '../../entities/recipe/RecipeCard';
import type { Recipe } from '../../shared/api/backendApi.types';
import styles from './ProposedRecipesPage.module.css';

interface ProposedRecipesPageProps {
  recipes: Recipe[];
}

export function ProposedRecipesPage({ recipes }: ProposedRecipesPageProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Предложенные рецепты</h1>
        <p className={styles.subtitle}>Рецепты, ожидающие модерации и публикации</p>
      </header>

      <div className={styles.recipesGrid}>
        {recipes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Нет предложенных рецептов</p>
          </div>
        ) : (
          recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
        )}
      </div>
    </div>
  );
}
