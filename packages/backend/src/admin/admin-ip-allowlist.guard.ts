import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * IP Allowlist Guard for admin routes.
 *
 * Set the `ADMIN_IP_ALLOWLIST` environment variable to a comma-separated list
 * of allowed IPv4/IPv6 addresses, e.g.:
 *
 *   ADMIN_IP_ALLOWLIST=203.0.113.10,203.0.113.11,::1
 *
 * If the variable is not set or empty, ALL IPs are permitted (backwards-compatible).
 *
 * NOTE: If the server is behind a reverse proxy (nginx, Cloudflare, etc.), configure
 * Express trust proxy in main.ts so that `req.ip` reflects the real client IP:
 *
 *   app.set('trust proxy', 1);   // trust first proxy hop
 */
@Injectable()
export class AdminIpAllowlistGuard implements CanActivate {
  private readonly allowlist: string[] | null;
  private readonly logger = new Logger(AdminIpAllowlistGuard.name);

  constructor(private readonly config: ConfigService) {
    const raw = config.get<string>('ADMIN_IP_ALLOWLIST', '');
    if (raw && raw.trim()) {
      this.allowlist = raw
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean);
      this.logger.log(`Admin IP allowlist active: ${this.allowlist.join(', ')}`);
    } else {
      this.allowlist = null; // Not configured — allow all (no restriction)
    }
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.allowlist || this.allowlist.length === 0) {
      return true; // ADMIN_IP_ALLOWLIST not set — allow all
    }

    const req = context.switchToHttp().getRequest<Request>();
    // req.ip is set by Express and already respects the trust proxy setting.
    // Strip IPv4-mapped IPv6 prefix (::ffff:) so '::ffff:127.0.0.1' matches '127.0.0.1'.
    const clientIp = (req.ip ?? '').replace(/^::ffff:/, '');

    if (!this.allowlist.includes(clientIp)) {
      this.logger.warn(`Admin access denied from IP: ${clientIp}`);
      throw new ForbiddenException('Admin access not permitted from this IP address');
    }

    return true;
  }
}
