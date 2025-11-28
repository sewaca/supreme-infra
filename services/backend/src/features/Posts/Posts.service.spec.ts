import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JsonplaceholderDatasource } from '../../shared/api/jsonplaceholderDatasource';
import { PostsService } from './Posts.service';

describe('PostsService', () => {
  let service: PostsService;
  let datasource: {
    getPosts: ReturnType<typeof vi.fn>;
    getPostById: ReturnType<typeof vi.fn>;
    getComments: ReturnType<typeof vi.fn>;
    getCommentsByPostId: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    datasource = {
      getPosts: vi.fn(),
      getPostById: vi.fn(),
      getComments: vi.fn(),
      getCommentsByPostId: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: JsonplaceholderDatasource,
          useValue: datasource,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  describe('getPostsSummary', () => {
    it('should return posts summary with truncated body and comments count', async () => {
      const mockPosts = [
        {
          userId: 1,
          id: 1,
          title: 'Test',
          body: 'This is a very long body text',
        },
        { userId: 1, id: 2, title: 'Test 2', body: 'Short' },
      ];

      const mockComments = [
        {
          postId: 1,
          id: 1,
          name: 'Test',
          email: 'test@test.com',
          body: 'Comment 1',
        },
        {
          postId: 1,
          id: 2,
          name: 'Test',
          email: 'test@test.com',
          body: 'Comment 2',
        },
        {
          postId: 2,
          id: 3,
          name: 'Test',
          email: 'test@test.com',
          body: 'Comment 3',
        },
      ];

      datasource.getPosts.mockResolvedValue(mockPosts);
      datasource.getComments.mockResolvedValue(mockComments);

      const result = await service.getPostsSummary();

      expect(result).toEqual([
        {
          userId: 1,
          id: 1,
          title: 'Test',
          body: 'This is a very long ...',
          commentsCount: 2,
        },
        {
          userId: 1,
          id: 2,
          title: 'Test 2',
          body: 'Short',
          commentsCount: 1,
        },
      ]);
    });

    it('should filter posts by userId when provided', async () => {
      const mockPosts = [{ userId: 1, id: 1, title: 'Test', body: 'Body' }];

      const mockComments: never[] = [];

      datasource.getPosts.mockResolvedValue(mockPosts);
      datasource.getComments.mockResolvedValue(mockComments);

      await service.getPostsSummary(1);

      expect(datasource.getPosts).toHaveBeenCalledWith(1);
    });

    it('should return 0 comments count when no comments exist', async () => {
      const mockPosts = [{ userId: 1, id: 1, title: 'Test', body: 'Body' }];

      const mockComments: never[] = [];

      datasource.getPosts.mockResolvedValue(mockPosts);
      datasource.getComments.mockResolvedValue(mockComments);

      const result = await service.getPostsSummary();

      expect(result[0].commentsCount).toBe(0);
    });
  });

  describe('getPostDetails', () => {
    it('should return post details with full body and comments', async () => {
      const mockPost = {
        userId: 1,
        id: 1,
        title: 'Test',
        body: 'Full body text',
      };

      const mockComments = [
        {
          postId: 1,
          id: 1,
          name: 'Test User',
          email: 'test@test.com',
          body: 'Comment text',
        },
      ];

      datasource.getPostById.mockResolvedValue(mockPost);
      datasource.getCommentsByPostId.mockResolvedValue(mockComments);

      const result = await service.getPostDetails(1);

      expect(result).toEqual({
        userId: 1,
        id: 1,
        title: 'Test',
        body: 'Full body text',
        comments: mockComments,
      });
    });
  });
});
