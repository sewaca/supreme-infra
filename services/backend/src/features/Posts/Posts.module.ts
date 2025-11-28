import { Module } from '@nestjs/common';
import { JsonplaceholderDatasource } from '../../shared/api/jsonplaceholderDatasource';
import { PostsController } from './Posts.controller';
import { PostsService } from './Posts.service';

@Module({
  imports: [],
  controllers: [PostsController],
  providers: [PostsService, JsonplaceholderDatasource],
})
export class PostsModule {}
