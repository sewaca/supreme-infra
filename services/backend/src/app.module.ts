import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PostsModule } from './features/Posts/Posts.module';

@Module({
  imports: [PostsModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
