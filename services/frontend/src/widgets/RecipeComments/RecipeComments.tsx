import { RecipeComment } from '../../shared/api/backendApi';
import { MarkdownContent } from '../../shared/components/MarkdownContent/MarkdownContent';
import styles from './RecipeComments.module.css';

interface RecipeCommentsProps {
  comments: RecipeComment[];
}

export function RecipeComments({ comments }: RecipeCommentsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Комментарии ({comments.length})</h2>
      <div className={styles.comments}>
        {comments.map((comment) => (
          <div key={comment.id} className={styles.comment}>
            <div className={styles.commentHeader}>
              <div className={styles.authorInfo}>
                <span className={styles.author}>{comment.author}</span>
                <span className={styles.date}>
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <div className={styles.rating}>{renderStars(comment.rating)}</div>
            </div>
            <div className={styles.commentContent}>
              <MarkdownContent content={comment.content} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
