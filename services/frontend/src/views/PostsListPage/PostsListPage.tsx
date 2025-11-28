import { PostCard } from '../../entities/post/PostCard';
import { PostSummary } from '../../shared/api/backendApi';
import { Breadcrumbs } from '../../widgets/Breadcrumbs/Breadcrumbs';
import styles from './PostsListPage.module.css';

interface PostsListPageProps {
  posts: PostSummary[];
  userId?: number;
}

export function PostsListPage({ posts, userId }: PostsListPageProps) {
  const breadcrumbsItems = userId
    ? [{ label: 'all posts', href: '/' }, { label: `user ${userId}` }]
    : [{ label: 'all posts' }];

  return (
    <div className={styles.container}>
      {userId && <Breadcrumbs items={breadcrumbsItems} />}
      <h1 className={styles.title}>Posts</h1>
      <div className={styles.grid}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
