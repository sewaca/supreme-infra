import { Module } from '@nestjs/common';
import { AuthModule } from './features/Auth/api/Auth.module';
import { HealthController } from './features/HealthCheck/api/health.controller';
import { RecipesModule } from './features/Recipes/api/Recipes.module';

@Module({
  imports: [RecipesModule, AuthModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
