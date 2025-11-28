import { Comment } from '../../shared/api/backendApi';
import styles from './CommentItem.module.css';

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className={styles.comment}>
      <div className={styles.name}>{comment.name}</div>
      <div className={styles.email}>{comment.email}</div>
      <p className={styles.body}>{comment.body}</p>
    </div>
  );
}
