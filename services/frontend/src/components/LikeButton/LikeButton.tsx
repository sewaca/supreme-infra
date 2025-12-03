'use client';

import { useState } from 'react';
import styles from './LikeButton.module.css';

interface LikeButtonProps {
  recipeId: number;
  initialLikes: number;
  onLike: (recipeId: number) => Promise<{ liked: boolean; totalLikes: number }>;
}

export function LikeButton({
  recipeId,
  initialLikes,
  onLike,
}: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await onLike(recipeId);
      setLikes(result.totalLikes);
      setIsLiked(result.liked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      alert('Не удалось поставить лайк. Возможно, вы не авторизованы.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
      onClick={handleLike}
      disabled={isLoading}
      aria-label={isLiked ? 'Убрать лайк' : 'Поставить лайк'}
    >
      <span className={styles.icon}>{isLiked ? '❤️' : '🤍'}</span>
      <span className={styles.count}>{likes}</span>
    </button>
  );
}
