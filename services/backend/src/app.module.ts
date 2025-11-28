import { Module } from '@nestjs/common';
import { PostsModule } from './features/Posts/Posts.module';

@Module({
  imports: [PostsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
