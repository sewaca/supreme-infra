import { Module } from '@nestjs/common';
import { AuthModule } from './features/Auth/Auth.module';
import { HealthController } from './features/HealthCheck/health.controller';
import { RecipesModule } from './features/Recipes/Recipes.module';

@Module({
  imports: [RecipesModule, AuthModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

// TODO: @remove
setInterval(() => {
  console.log('Hello, world!');
}, 10000);
setInterval(() => {
  console.error('error, world!');
}, 20000);
