import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { checkSession } from '@supreme-int/authorization-lib/src/session/check-session';
import type { Observable } from 'rxjs';

export const SESSION_CHECK_ROUTES = 'SESSION_CHECK_ROUTES';

export interface SessionCheckRoute {
  path: RegExp;
  method?: string;
  auth_level: 'none' | 'valid';
}

@Injectable()
export class SessionCheckInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SessionCheckInterceptor.name);

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(SESSION_CHECK_ROUTES) private readonly routes: SessionCheckRoute[] = [],
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<{
      url: string;
      method: string;
      headers: Record<string, string | undefined>;
    }>();

    const requestPath = request.url?.split('?')[0] ?? '/';

    const matched = this.routes.find(
      (r) => r.path.test(requestPath) && (!r.method || r.method.toUpperCase() === request.method.toUpperCase()),
    );
    const authLevel = matched?.auth_level ?? 'none';

    if (authLevel === 'none') {
      this.logger.log(`session check: skipped (auth_level=none) path='${requestPath}' method='${request.method}'`);
      return next.handle();
    }

    // authLevel === 'valid': require Bearer token + valid session
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authHeader.slice(7);
    const coreAuthUrl = this.configService.get<string>(
      'CORE_AUTH_URL',
      'http://core-auth.default.svc.cluster.local/core-auth',
    );

    const { status, durationMs } = await checkSession({ token, coreAuthUrl });
    this.logger.log(`session check: status='${status}' elapsed=${durationMs.toFixed(1)}ms path='${requestPath}'`);

    if (status === 'revoked') {
      throw new UnauthorizedException('Session has been revoked');
    }

    return next.handle();
  }
}
