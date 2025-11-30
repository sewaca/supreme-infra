import { Module } from '@nestjs/common';
import { PostsModule } from './features/Posts/Posts.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PostsModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
