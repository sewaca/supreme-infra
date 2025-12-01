import { Injectable } from '@nestjs/common';

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

@Injectable()
export class JsonplaceholderDatasource {
  private readonly baseUrl =
    process.env.JSONPLACEHOLDER_URL || 'https://jsonplaceholder.typicode.com';

  public async getPosts(userId?: number): Promise<Post[]> {
    const url = userId
      ? `${this.baseUrl}/posts?userId=${userId}`
      : `${this.baseUrl}/posts`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return response.json() as Promise<Post[]>;
  }

  public async getPostById(postId: number): Promise<Post> {
    const url = `${this.baseUrl}/posts/${postId}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Post not found');
      }
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return response.json() as Promise<Post>;
  }

  public async getComments(): Promise<Comment[]> {
    const url = `${this.baseUrl}/comments`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    return response.json() as Promise<Comment[]>;
  }

  public async getCommentsByPostId(postId: number): Promise<Comment[]> {
    const url = `${this.baseUrl}/posts/${postId}/comments`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    return response.json() as Promise<Comment[]>;
  }
}
