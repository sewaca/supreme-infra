import Link from 'next/link';
import { PostSummary } from '../../shared/api/backendApi';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: PostSummary;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/${post.id}`} className={styles.card}>
      <h2 className={styles.title}>{post.title}</h2>
      <p className={styles.body}>{post.body}</p>
      <div className={styles.commentsCount}>Comments: {post.commentsCount}</div>
    </Link>
  );
}
