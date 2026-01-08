import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, HealthModule, LoggerModule } from '@supreme-int/nestjs-shared';
import { AuthModule } from './features/Auth/api/Auth.module';
import { UserEntity } from './features/Auth/model/User.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    HealthModule.forRoot({ serviceName: 'core-auth-bff' }),
    ...createDatabaseImports({ entities: [UserEntity] }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
