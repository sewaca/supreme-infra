import type { ReactNode } from 'react';
import styles from './RecipeHeader.module.css';

interface RecipeHeaderProps {
  title: string | ReactNode;
  imageUrl: string;
}

export function RecipeHeader({ title, imageUrl }: RecipeHeaderProps) {
  const altText = typeof title === 'string' ? title : 'Recipe image';

  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.imageContainer}>
        <img src={imageUrl} alt={altText} className={styles.image} />
      </div>
    </div>
  );
}
