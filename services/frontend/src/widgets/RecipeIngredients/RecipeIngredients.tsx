import type { RecipeIngredient } from '../../shared/api/backendApi.types';
import styles from './RecipeIngredients.module.css';

interface RecipeIngredientsProps {
  ingredients: RecipeIngredient[];
}

export function RecipeIngredients({ ingredients }: RecipeIngredientsProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Ингредиенты</h2>
      <ul className={styles.list}>
        {ingredients.map((ingredient, index) => (
          <li key={`${ingredient.name}-${index}`} className={styles.item}>
            <span className={styles.checkbox}>✓</span>
            <span className={styles.name}>{ingredient.name}</span>
            <span className={styles.amount}>{ingredient.amount}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
