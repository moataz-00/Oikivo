import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';

/**
 * WhySMS HTTP API integration
 *
 * Set the following environment variables:
 *   WHYSMS_API_URL   — Base API URL   (verify exact path from your PDF docs,
 *                      default: https://www.whysms.net/api/)
 *   WHYSMS_USERNAME  — Account username
 *   WHYSMS_PASSWORD  — Account password
 *   WHYSMS_SENDER    — Registered sender ID shown to recipients
 *
 * Response codes (WhySMS standard):
 *   100 — Message sent successfully
 *   101 — Invalid username or password
 *   102 — Invalid or unreachable mobile number
 *   103 — Insufficient SMS credit
 *   200 — Message queued / pending
 *   500 — Server-side error
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Send a plain-text SMS.
   * Normalises Egyptian mobile numbers (01X → 201X).
   * Throws on HTTP transport errors; logs (but does NOT throw) on API-level
   * rejection so a single bad number never crashes the caller.
   */
  async send(to: string, message: string): Promise<void> {
    const username = this.config.get<string>('WHYSMS_USERNAME');
    const password = this.config.get<string>('WHYSMS_PASSWORD');
    const sender   = this.config.get<string>('WHYSMS_SENDER', 'JourneyStay');
    const baseUrl  = this.config.get<string>('WHYSMS_API_URL', 'https://www.whysms.net/api/');

    if (!username || !password) {
      this.logger.warn('WHYSMS_USERNAME / WHYSMS_PASSWORD not configured — SMS skipped');
      return;
    }

    const mobile = this.normalisePhone(to);
    // FIX O5: Send credentials in POST body instead of URL query parameters
    // to prevent them from appearing in server logs and error reporting
    const formBody = new URLSearchParams({ username, password, mobile, message, sender }).toString();
    const url = baseUrl.replace(/\/$/, '');

    let responseBody = '';
    try {
      responseBody = await this.httpPost(url, formBody);
    } catch (err: any) {
      this.logger.error(`WhySMS transport error for ${mobile}: ${err.message}`);
      throw err;
    }

    // WhySMS returns a numeric status code as plain text (e.g. "100")
    const code = responseBody.trim();
    if (code === '100' || code === '200') {
      this.logger.log(`SMS sent to ${mobile} (status ${code})`);
    } else {
      this.logger.warn(`WhySMS returned code ${code} for ${mobile}`);
      // Don't throw — the OTP was stored; the user can request again
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Normalise Egyptian mobile numbers to international format (e.g. 01012345678 → 201012345678).
   * Numbers that already start with a country code (2, 20, +20) are left unchanged.
   */
  normalisePhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');

    // Remove leading + if present (already handled by replace above)
    if (digits.startsWith('20') && digits.length === 12) return digits;          // already correct
    if (digits.startsWith('0') && digits.length === 11) return `2${digits}`;     // 01X... → 201X...
    if (!digits.startsWith('0') && digits.length === 10) return `20${digits}`;   // 1X... → 201X...
    return digits; // leave as-is for non-Egyptian or already-normalised numbers
  }

  private httpPost(url: string, body: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const transport = url.startsWith('https') ? https : http;
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (url.startsWith('https') ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const req = transport.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(10_000, () => {
        req.destroy(new Error('WhySMS request timed out after 10 s'));
      });
      req.write(body);
      req.end();
    });
  }
}
