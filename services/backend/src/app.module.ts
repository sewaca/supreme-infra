import { Module } from '@nestjs/common';
import { AuthModule } from './features/Auth/Auth.module';
import { RecipesModule } from './features/Recipes/Recipes.module';
import { HealthController } from './features/HealthCheck/health.controller';

@Module({
  imports: [RecipesModule, AuthModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
