import { Logger } from '@nestjs/common';
import { QueryRunner, Logger as TypeOrmLogger } from 'typeorm';

export class CustomTypeOrmLogger implements TypeOrmLogger {
  private readonly logger = new Logger('TypeORM');

  logQuery(query: string, parameters?: unknown[], queryRunner?: QueryRunner): void {
    const dbInfo = this.getDatabaseInfo(queryRunner);
    this.logger.log(`📊 Query executed ${dbInfo}\n${this.formatQuery(query, parameters)}`);
  }

  logQueryError(error: string | Error, query: string, parameters?: unknown[], queryRunner?: QueryRunner): void {
    const dbInfo = this.getDatabaseInfo(queryRunner);
    this.logger.error(`❌ Query failed ${dbInfo}\n${this.formatQuery(query, parameters)}\nError: ${error}`);
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[], queryRunner?: QueryRunner): void {
    const dbInfo = this.getDatabaseInfo(queryRunner);
    this.logger.warn(`🐌 Slow query (${time}ms) ${dbInfo}\n${this.formatQuery(query, parameters)}`);
  }

  logSchemaBuild(message: string): void {
    this.logger.log(`🏗️  Schema: ${message}`);
  }

  logMigration(message: string): void {
    this.logger.log(`🔄 Migration: ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: string): void {
    switch (level) {
      case 'log':
      case 'info':
        this.logger.log(`ℹ️  ${message}`);
        break;
      case 'warn':
        this.logger.warn(`⚠️  ${message}`);
        break;
    }
  }

  private getDatabaseInfo(queryRunner?: QueryRunner): string {
    if (!queryRunner?.connection) {
      return '[DB: unknown]';
    }

    const { host, port, database, username } = queryRunner.connection.options as {
      host?: string;
      port?: number;
      database?: string;
      username?: string;
    };

    return `[DB: ${database}@${host}:${port} as ${username}]`;
  }

  // TODO:
  private formatQuery(query: string, _parameters?: unknown[]): string {
    return query;
  }
}
