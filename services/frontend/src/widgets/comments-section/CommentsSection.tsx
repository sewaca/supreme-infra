import { CommentItem } from '../../entities/comment/CommentItem';
import { Comment } from '../../shared/api/backendApi';
import styles from './CommentsSection.module.css';

interface CommentsSectionProps {
  comments: Comment[];
}

export function CommentsSection({ comments }: CommentsSectionProps) {
  return (
    <section>
      <h2 className={styles.title}>Comments ({comments.length})</h2>

      {comments.length === 0 ? (
        <p className={styles.empty}>No comments yet.</p>
      ) : (
        <div className={styles.list}>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </section>
  );
}
