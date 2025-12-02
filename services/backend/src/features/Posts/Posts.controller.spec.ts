import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostsController } from './Posts.controller';
import { PostsService } from './Posts.service';

describe.skip('PostsController', () => {
  let controller: PostsController;
  let service: {
    getPostsSummary: ReturnType<typeof vi.fn>;
    getPostDetails: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      getPostsSummary: vi.fn(),
      getPostDetails: vi.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  describe('getSummary', () => {
    it('should return posts summary', async () => {
      const mockPosts = [
        {
          userId: 1,
          id: 1,
          title: 'Test',
          body: 'Body',
          commentsCount: 0,
        },
      ];

      service.getPostsSummary.mockResolvedValue(mockPosts);

      const result = await controller.getSummary();

      expect(service.getPostsSummary).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockPosts);
    });

    it('should filter by userId when provided', async () => {
      const mockPosts = [
        {
          userId: 1,
          id: 1,
          title: 'Test',
          body: 'Body',
          commentsCount: 0,
        },
      ];

      service.getPostsSummary.mockResolvedValue(mockPosts);

      const result = await controller.getSummary('1');

      expect(service.getPostsSummary).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPosts);
    });

    it('should throw BadRequestException for invalid userId', async () => {
      await expect(controller.getSummary('invalid')).rejects.toThrow(
        BadRequestException,
      );
      expect(service.getPostsSummary).not.toHaveBeenCalled();
    });
  });

  describe('getPostDetails', () => {
    it('should return post details', async () => {
      const mockPost = {
        userId: 1,
        id: 1,
        title: 'Test',
        body: 'Body',
        comments: [],
      };

      service.getPostDetails.mockResolvedValue(mockPost);

      const result = await controller.getPostDetails('1');

      expect(service.getPostDetails).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPost);
    });

    it('should throw BadRequestException for invalid post id', async () => {
      await expect(controller.getPostDetails('invalid')).rejects.toThrow(
        BadRequestException,
      );
      expect(service.getPostDetails).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when post not found', async () => {
      service.getPostDetails.mockRejectedValue(new Error('Post not found'));

      await expect(controller.getPostDetails('999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should rethrow other errors', async () => {
      const error = new Error('Network error');
      service.getPostDetails.mockRejectedValue(error);

      await expect(controller.getPostDetails('1')).rejects.toThrow(
        'Network error',
      );
    });
  });
});
