import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backendApi, PostDetails, PostSummary } from './backendApi';

// Mock global fetch
global.fetch = vi.fn();

describe('BackendApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPostsSummary', () => {
    it('should fetch all posts when userId is not provided', async () => {
      const mockPosts: PostSummary[] = [
        {
          userId: 1,
          id: 1,
          title: 'Test',
          body: 'Body',
          commentsCount: 0,
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });

      const result = await backendApi.getPostsSummary();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/posts/get-summary',
      );
      expect(result).toEqual(mockPosts);
    });

    it('should fetch posts filtered by userId', async () => {
      const mockPosts: PostSummary[] = [
        {
          userId: 1,
          id: 1,
          title: 'Test',
          body: 'Body',
          commentsCount: 0,
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });

      const result = await backendApi.getPostsSummary(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/posts/get-summary?userId=1',
      );
      expect(result).toEqual(mockPosts);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(backendApi.getPostsSummary()).rejects.toThrow(
        'Failed to fetch posts: Not Found',
      );
    });
  });

  describe('getPostDetails', () => {
    it('should fetch post details', async () => {
      const mockPost: PostDetails = {
        userId: 1,
        id: 1,
        title: 'Test',
        body: 'Body',
        comments: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPost,
      });

      const result = await backendApi.getPostDetails(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/posts/1',
      );
      expect(result).toEqual(mockPost);
    });

    it('should throw error when post not found', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(backendApi.getPostDetails(999)).rejects.toThrow(
        'Post not found',
      );
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(backendApi.getPostDetails(1)).rejects.toThrow(
        'Failed to fetch post: Internal Server Error',
      );
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = backendApi;
      const instance2 = backendApi;

      expect(instance1).toBe(instance2);
    });
  });
});
