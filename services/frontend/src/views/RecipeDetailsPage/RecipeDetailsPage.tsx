'use client';

import Link from 'next/link';
import { LikeButton } from '../../components/LikeButton/LikeButton';
import { backendApi, RecipeDetails } from '../../shared/api/backendApi';
import { MarkdownContent } from '../../shared/components/MarkdownContent/MarkdownContent';
import { getAuthToken } from '../../shared/lib/auth.client';
import { RecipeComments } from '../../widgets/RecipeComments/RecipeComments';
import { RecipeHeader } from '../../widgets/RecipeHeader/RecipeHeader';
import { RecipeIngredients } from '../../widgets/RecipeIngredients/RecipeIngredients';
import { RecipeMeta } from '../../widgets/RecipeMeta/RecipeMeta';
import { RecipeSteps } from '../../widgets/RecipeSteps/RecipeSteps';
import styles from './RecipeDetailsPage.module.css';

interface RecipeDetailsPageProps {
  recipe: RecipeDetails;
}

export function RecipeDetailsPage({ recipe }: RecipeDetailsPageProps) {
  const handleLike = async (recipeId: number) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    return backendApi.toggleRecipeLike(recipeId, token);
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        ← Назад к рецептам
      </Link>

      <RecipeHeader
        title={
          <div className={styles.titleContainer}>
            {recipe.title}
            <LikeButton
              recipeId={recipe.id}
              initialLikes={recipe.likes}
              onLike={handleLike}
            />
          </div>
        }
        imageUrl={recipe.imageUrl}
      />

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Описание</h2>
            <MarkdownContent content={recipe.description} />
          </section>

          <RecipeIngredients ingredients={recipe.detailedIngredients} />

          <RecipeSteps steps={recipe.steps} />

          <RecipeComments comments={recipe.comments} />
        </div>

        <aside className={styles.sidebar}>
          <RecipeMeta
            servings={recipe.servings}
            calories={recipe.calories}
            cookingTime={recipe.cookingTime}
            difficulty={recipe.difficulty}
            author={recipe.author}
            likes={recipe.likes}
          />
        </aside>
      </div>
    </div>
  );
}
