import Link from 'next/link';
import type { Recipe } from '../../shared/api/backendApi.types';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const difficultyLabels = {
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
  };

  return (
    <Link href={`/recipes/${recipe.id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        <div
          className={styles.image}
          style={{ backgroundImage: `url(${recipe.imageUrl})` }}
          role="img"
          aria-label={recipe.title}
        />
        <div className={styles.difficulty}>
          {difficultyLabels[recipe.difficulty]}
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{recipe.title}</h3>
        <p className={styles.description}>{recipe.description}</p>
        <div className={styles.metaContainer}>
          <div className={styles.meta}>
            <span className={styles.metaItem}>⏱ {recipe.cookingTime} мин</span>
            <span className={styles.metaItem}>🍽️ {recipe.servings} порц.</span>
            <span className={styles.metaItem}>🔥 {recipe.calories} ккал</span>
          </div>
          <div className={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, index) => (
              <span
                key={`${index}-${ingredient}`}
                className={styles.ingredient}
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
