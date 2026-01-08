import './instrumentation';
import { bootstrapNestApp } from '@supreme-int/nestjs-shared';
import { AppModule } from './app.module';
import { loggerProvider } from './instrumentation';

async function bootstrap() {
  await bootstrapNestApp({
    AppModule,
    serviceName: 'backend',
    apiPrefix: 'main-api',
    port: '4000',
    loggerProvider,
  });
}
bootstrap();
