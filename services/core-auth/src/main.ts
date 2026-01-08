import './instrumentation';
import { bootstrapNestApp } from '@supreme-int/nestjs-shared';
import { AppModule } from './app.module';
import { loggerProvider } from './instrumentation';

async function bootstrap() {
  await bootstrapNestApp({
    AppModule,
    serviceName: 'core-auth',
    apiPrefix: 'core-auth',
    port: '4001',
    loggerProvider,
  });
}
bootstrap();
