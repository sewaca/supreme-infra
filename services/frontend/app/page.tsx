import { PostsListPage } from '../src/views/PostsListPage/PostsListPage';
import { backendApi } from '../src/shared/api/backendApi';

interface HomeProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const userId = params.userId ? Number.parseInt(params.userId, 10) : undefined;

  const posts = await backendApi.getPostsSummary(userId);

  return <PostsListPage posts={posts} userId={userId} />;
}
