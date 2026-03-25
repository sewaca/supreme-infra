import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Observable } from 'rxjs';

type ValidateSessionResponse = {
  status: 'valid' | 'revoked' | 'expired' | 'invalid';
};

@Injectable()
export class SessionCheckInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SessionCheckInterceptor.name);

  constructor(private readonly configService: ConfigService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      return next.handle();
    }

    const token = authHeader.slice(7);
    const coreAuthUrl = this.configService.get<string>('CORE_AUTH_URL', 'http://localhost:8002/core-auth');

    const start = Date.now();

    try {
      const res = await fetch(`${coreAuthUrl}/auth/validate-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(5000),
      });

      const elapsed = Date.now() - start;
      const data = (await res.json()) as ValidateSessionResponse;
      const sessionStatus = data.status;

      this.logger.log(`session check. status='${sessionStatus}' elapsed ${elapsed}ms`);

      if (sessionStatus === 'revoked') {
        throw new UnauthorizedException('Session has been revoked');
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      const elapsed = Date.now() - start;
      this.logger.warn(`session check. status='error' elapsed ${elapsed}ms: ${(err as Error).message}`);
    }

    return next.handle();
  }
}
