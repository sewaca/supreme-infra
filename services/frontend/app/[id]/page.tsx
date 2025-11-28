import { notFound } from 'next/navigation';
import { PostDetailsPage } from '../../src/pages/PostDetailsPage';
import { backendApi, PostDetails } from '../../src/shared/api/backendApi';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const postId = Number.parseInt(id, 10);

  if (Number.isNaN(postId)) {
    notFound();
  }

  let post: PostDetails;
  try {
    post = await backendApi.getPostDetails(postId);
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      notFound();
    }
    throw error;
  }

  return <PostDetailsPage post={post} />;
}
