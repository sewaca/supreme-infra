import styles from './RecipeMeta.module.css';

interface RecipeMetaProps {
  servings: number;
  calories: number;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  author: string;
  likes: number;
}

export function RecipeMeta({
  servings,
  calories,
  cookingTime,
  difficulty,
  author,
  likes,
}: RecipeMetaProps) {
  const difficultyLabels = {
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
  };

  return (
    <div className={styles.meta}>
      <h3 className={styles.title}>Информация</h3>

      <div className={styles.item}>
        <span className={styles.icon}>👤</span>
        <div className={styles.itemContent}>
          <span className={styles.label}>Автор</span>
          <span className={styles.value}>{author}</span>
        </div>
      </div>

      <div className={styles.item}>
        <span className={styles.icon}>🍽️</span>
        <div className={styles.itemContent}>
          <span className={styles.label}>Порций</span>
          <span className={styles.value}>{servings}</span>
        </div>
      </div>

      <div className={styles.item}>
        <span className={styles.icon}>🔥</span>
        <div className={styles.itemContent}>
          <span className={styles.label}>Калории</span>
          <span className={styles.value}>{calories} ккал</span>
        </div>
      </div>

      <div className={styles.item}>
        <span className={styles.icon}>⏱️</span>
        <div className={styles.itemContent}>
          <span className={styles.label}>Время</span>
          <span className={styles.value}>{cookingTime} мин</span>
        </div>
      </div>

      <div className={styles.item}>
        <span className={styles.icon}>📊</span>
        <div className={styles.itemContent}>
          <span className={styles.label}>Сложность</span>
          <span className={styles.value}>{difficultyLabels[difficulty]}</span>
        </div>
      </div>

      <div className={styles.item}>
        <span className={styles.icon}>❤️</span>
        <div className={styles.itemContent}>
          <span className={styles.label}>Лайков</span>
          <span className={styles.value}>{likes}</span>
        </div>
      </div>
    </div>
  );
}
