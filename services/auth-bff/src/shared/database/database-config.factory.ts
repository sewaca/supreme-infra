import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createDatabaseConfig as createBaseDatabaseConfig } from '@supreme-int/nestjs-shared';

export function createDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
  return createBaseDatabaseConfig(configService, {
    entities: [],
  });
}
