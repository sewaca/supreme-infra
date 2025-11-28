import { JsonplaceholderDatasource } from './jsonplaceholderDatasource';

// Mock global fetch
global.fetch = jest.fn();

describe('JsonplaceholderDatasource', () => {
  let datasource: JsonplaceholderDatasource;

  beforeEach(() => {
    datasource = new JsonplaceholderDatasource();
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should fetch all posts when userId is not provided', async () => {
      const mockPosts = [
        { userId: 1, id: 1, title: 'Test', body: 'Body' },
        { userId: 2, id: 2, title: 'Test 2', body: 'Body 2' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });

      const result = await datasource.getPosts();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://jsonplaceholder.typicode.com/posts',
      );
      expect(result).toEqual(mockPosts);
    });

    it('should fetch posts filtered by userId', async () => {
      const mockPosts = [{ userId: 1, id: 1, title: 'Test', body: 'Body' }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });

      const result = await datasource.getPosts(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://jsonplaceholder.typicode.com/posts?userId=1',
      );
      expect(result).toEqual(mockPosts);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(datasource.getPosts()).rejects.toThrow(
        'Failed to fetch posts: Not Found',
      );
    });
  });

  describe('getPostById', () => {
    it('should fetch post by id', async () => {
      const mockPost = { userId: 1, id: 1, title: 'Test', body: 'Body' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPost,
      });

      const result = await datasource.getPostById(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://jsonplaceholder.typicode.com/posts/1',
      );
      expect(result).toEqual(mockPost);
    });

    it('should throw error when post not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(datasource.getPostById(999)).rejects.toThrow(
        'Post not found',
      );
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(datasource.getPostById(1)).rejects.toThrow(
        'Failed to fetch post: Internal Server Error',
      );
    });
  });

  describe('getComments', () => {
    it('should fetch all comments', async () => {
      const mockComments = [
        {
          postId: 1,
          id: 1,
          name: 'Test',
          email: 'test@test.com',
          body: 'Comment',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      });

      const result = await datasource.getComments();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://jsonplaceholder.typicode.com/comments',
      );
      expect(result).toEqual(mockComments);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(datasource.getComments()).rejects.toThrow(
        'Failed to fetch comments: Not Found',
      );
    });
  });

  describe('getCommentsByPostId', () => {
    it('should fetch comments by post id', async () => {
      const mockComments = [
        {
          postId: 1,
          id: 1,
          name: 'Test',
          email: 'test@test.com',
          body: 'Comment',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      });

      const result = await datasource.getCommentsByPostId(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://jsonplaceholder.typicode.com/posts/1/comments',
      );
      expect(result).toEqual(mockComments);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(datasource.getCommentsByPostId(1)).rejects.toThrow(
        'Failed to fetch comments: Not Found',
      );
    });
  });
});
