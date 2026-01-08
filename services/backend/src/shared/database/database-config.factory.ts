import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createDatabaseConfig as createBaseDatabaseConfig } from '@supreme-int/nestjs-shared';
import { RecipeLikeEntity, UserEntity } from '../../features/Auth/model/User.entity';

export function createDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
  return createBaseDatabaseConfig(configService, {
    entities: [UserEntity, RecipeLikeEntity],
  });
}
