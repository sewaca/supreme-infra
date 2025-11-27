export interface PostSummary {
  userId: number;
  id: number;
  title: string;
  body: string;
  commentsCount: number;
}

export interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

export interface PostDetails {
  userId: number;
  id: number;
  title: string;
  body: string;
  comments: Comment[];
}

class BackendApi {
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  }

  private static instance: BackendApi | null = null;

  public static getInstance(): BackendApi {
    if (!BackendApi.instance) {
      BackendApi.instance = new BackendApi();
    }
    return BackendApi.instance;
  }

  public async getPostsSummary(userId?: number): Promise<PostSummary[]> {
    const url = userId
      ? `${this.baseUrl}/posts/get-summary?userId=${userId}`
      : `${this.baseUrl}/posts/get-summary`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return response.json() as Promise<PostSummary[]>;
  }

  public async getPostDetails(postId: number): Promise<PostDetails> {
    const url = `${this.baseUrl}/posts/${postId}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Post not found');
      }
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return response.json() as Promise<PostDetails>;
  }
}

export const backendApi = BackendApi.getInstance();
