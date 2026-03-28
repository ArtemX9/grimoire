import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';

import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`${method} ${url} — ${ms}ms`);
        },
        error: (err: unknown) => {
          const ms = Date.now() - start;
          const status = (err as { status?: number }).status ?? 500;
          this.logger.warn(`${method} ${url} — ${status} ${ms}ms`);
        },
      }),
    );
  }
}
