import { PostDetails } from '../../shared/api/backendApi';
import { Breadcrumbs } from '../../widgets/Breadcrumbs/Breadcrumbs';
import { CommentsSection } from '../../widgets/CommentsSection/CommentsSection';
import styles from './PostDetailsPage.module.css';

interface PostDetailsPageProps {
  post: PostDetails;
}

export function PostDetailsPage({ post }: PostDetailsPageProps) {
  const breadcrumbsItems = [
    { label: 'all posts', href: '/' },
    { label: `user ${post.userId}`, href: `/?userId=${post.userId}` },
    { label: post.title },
  ];

  return (
    <div className={styles.container}>
      <Breadcrumbs items={breadcrumbsItems} />

      <article>
        <h1 className={styles.title}>{post.title}</h1>

        <div className={styles.bodyContainer}>
          <p className={styles.body}>{post.body}</p>
        </div>

        <CommentsSection comments={post.comments} />
      </article>
    </div>
  );
}
