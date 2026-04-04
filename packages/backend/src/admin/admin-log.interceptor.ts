import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdminActivityLogService } from './admin-activity-log.service';

/** Derives a human-readable action label from the HTTP method + path. */
function deriveAction(method: string, path: string): string {
  // Remove /api prefix and query strings
  const clean = path.replace(/^\/api/, '').replace(/\?.*$/, '');
  const segments = clean.split('/').filter(Boolean); // ['admin', 'users', '5', 'toggle-active']

  // Drop leading 'admin'
  if (segments[0] === 'admin') segments.shift();

  // Replace numeric segments with :id
  const normalized = segments.map((s) => (/^\d+$/.test(s) ? ':id' : s)).join('/');

  return `${method} /${normalized}`;
}

/** Extracts the entity type and id from a path like /admin/users/5/toggle-active */
function extractEntity(path: string): { entityType?: string; entityId?: string } {
  const clean = path.replace(/^\/api/, '').replace(/\?.*$/, '');
  const segments = clean.split('/').filter(Boolean);
  if (segments[0] === 'admin') segments.shift();

  const entityType = segments[0];
  const numericIdx = segments.findIndex((s) => /^\d+$/.test(s));
  const entityId = numericIdx !== -1 ? segments[numericIdx] : undefined;
  return { entityType, entityId };
}

@Injectable()
export class AdminLogInterceptor implements NestInterceptor {
  constructor(private readonly logService: AdminActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    // Only log mutating requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        try {
          const adminId: number = req.user?.id ?? req.user?.userId;
          if (!adminId) return;

          const path: string = req.path ?? req.url ?? '';
          const action = deriveAction(method, path);
          const { entityType, entityId } = extractEntity(path);
          const ip: string =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
            req.socket?.remoteAddress ??
            undefined;

          // Fire-and-forget — do not block response
          this.logService
            .log(adminId, action, entityType, entityId, undefined, ip)
            .catch(() => void 0);
        } catch {
          // Never let logging errors break the response
        }
      }),
    );
  }
}
