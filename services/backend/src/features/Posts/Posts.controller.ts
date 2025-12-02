import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { PostsService } from './Posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('get-summary')
  public async getSummary(
    @Query('userId') userId?: string,
  ): Promise<ReturnType<PostsService['getPostsSummary']>> {
    const userIdNumber = userId ? Number.parseInt(userId, 10) : undefined;

    if (userId && Number.isNaN(userIdNumber)) {
      throw new BadRequestException('Invalid userId parameter');
    }

    // return [
    //   {
    //     userId: 228,
    //     id: 228,
    //     title: 'сломанный релиз',
    //     body: 'сломанный релиз',
    //     commentsCount: 227,
    //   },
    // ];

    return this.postsService.getPostsSummary(userIdNumber);
  }

  @Get(':id')
  public async getPostDetails(
    @Param('id') id: string,
  ): Promise<ReturnType<PostsService['getPostDetails']>> {
    const postId = Number.parseInt(id, 10);

    if (Number.isNaN(postId)) {
      throw new BadRequestException('Invalid post id parameter');
    }

    try {
      return await this.postsService.getPostDetails(postId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Post not found') {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }
}
