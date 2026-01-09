import './instrumentation';
import { bootstrapNestApp } from '@supreme-int/nestjs-shared';
import { AppModule } from './app.module';
import { loggerProvider } from './instrumentation';

async function bootstrap() {
  await bootstrapNestApp({
    AppModule,
    serviceName: 'core-recipes-bff',
    apiPrefix: 'core-recipes-bff',
    port: '4002',
    loggerProvider,
  });
}
bootstrap();
