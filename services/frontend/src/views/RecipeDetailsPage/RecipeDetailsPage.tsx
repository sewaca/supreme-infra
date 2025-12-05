'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  isProposed?: boolean;
}

export function RecipeDetailsPage({
  recipe,
  isProposed = false,
}: RecipeDetailsPageProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  const handlePublish = async () => {
    const token = getAuthToken();
    if (!token) {
      setPublishError('Необходима авторизация');
      return;
    }

    setIsPublishing(true);
    setPublishError('');

    try {
      await backendApi.publishRecipe(recipe.id, token);
      router.push('/proposed-recipes');
      router.refresh();
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : 'Ошибка при публикации',
      );
    } finally {
      setIsPublishing(false);
    }
  };
  const handleLike = async (recipeId: number) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    return backendApi.toggleRecipeLike(recipeId, token);
  };

  return (
    <div className={styles.container}>
      <Link
        href={isProposed ? '/proposed-recipes' : '/'}
        className={styles.backLink}
      >
        ← Назад {isProposed ? 'к предложенным рецептам' : 'к рецептам'}
      </Link>

      {isProposed && (
        <div className={styles.proposedBanner}>
          <div className={styles.proposedBannerContent}>
            <span className={styles.proposedBadge}>Предложен</span>
            <p className={styles.proposedText}>
              Этот рецепт ожидает модерации и публикации
            </p>
          </div>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className={styles.publishButton}
          >
            {isPublishing ? 'Публикация...' : 'Опубликовать'}
          </button>
          {publishError && (
            <div className={styles.publishError}>{publishError}</div>
          )}
        </div>
      )}

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
