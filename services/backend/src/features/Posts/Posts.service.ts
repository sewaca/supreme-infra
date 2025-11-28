import { Injectable } from '@nestjs/common';
import {
  Comment,
  JsonplaceholderDatasource,
} from '../../shared/api/jsonplaceholderDatasource';

export interface PostSummary {
  userId: number;
  id: number;
  title: string;
  body: string;
  commentsCount: number;
}

export interface PostDetails {
  userId: number;
  id: number;
  title: string;
  body: string;
  comments: Comment[];
}

@Injectable()
export class PostsService {
  constructor(
    private readonly jsonplaceholderDatasource: JsonplaceholderDatasource,
  ) {}

  public async getPostsSummary(userId?: number): Promise<PostSummary[]> {
    const [posts, comments] = await Promise.all([
      this.jsonplaceholderDatasource.getPosts(userId),
      this.jsonplaceholderDatasource.getComments(),
    ]);

    const commentsCountByPostId = this.countCommentsByPostId(comments);

    return posts.map((post) => ({
      userId: post.userId,
      id: post.id,
      title: post.title,
      body: this.truncateBody(post.body),
      commentsCount: commentsCountByPostId.get(post.id) ?? 0,
    }));
  }

  private truncateBody(body: string): string {
    if (body.length <= 20) {
      return body;
    }
    return `${body.substring(0, 20)}...`;
  }

  public async getPostDetails(postId: number): Promise<PostDetails> {
    const [post, comments] = await Promise.all([
      this.jsonplaceholderDatasource.getPostById(postId),
      this.jsonplaceholderDatasource.getCommentsByPostId(postId),
    ]);

    return {
      userId: post.userId,
      id: post.id,
      title: post.title,
      body: post.body,
      comments,
    };
  }

  private countCommentsByPostId(comments: Comment[]): Map<number, number> {
    const countMap = new Map<number, number>();

    for (const comment of comments) {
      const currentCount = countMap.get(comment.postId) ?? 0;
      countMap.set(comment.postId, currentCount + 1);
    }

    return countMap;
  }
}
