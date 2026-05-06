import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

/**
 * WhatsApp messaging via t7km Plus API
 * Docs   : https://wa.t7kmplus.com.eg/developer
 * Endpoint: POST https://wac.t7km.com/api/whats/sendMessage
 * Header : X-API-Key: <T7KM_API_KEY>
 * Body   : { number: "201XXXXXXXXX", message: "..." }
 *
 * Required env var:
 *   T7KM_API_KEY � API key from https://wa.t7kmplus.com.eg/device
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  /** Serial queue — ensures messages are sent one at a time with a gap between them */
  private sendQueue: Promise<void> = Promise.resolve();
  /** Minimum gap in ms between consecutive WhatsApp sends */
  private static readonly SEND_GAP_MS = 1_500;

  constructor(private readonly config: ConfigService) {}

  /**
   * Check whether the WhatsApp device is still connected.
   * Returns true if connected, false otherwise.
   */
  async checkOnline(): Promise<boolean> {
    const apiKey = this.config.get<string>('T7KM_API_KEY');
    if (!apiKey) return false;
    try {
      const resp   = await this.httpGetJson('https://wac.t7km.com/api/whats/check-online', { 'X-API-Key': apiKey });
      const parsed = JSON.parse(resp) as { isSuccess: boolean };
      return parsed.isSuccess === true;
    } catch {
      return false;
    }
  }

  /**
   * Send a WhatsApp message via t7km Plus.
   * Calls are serialised — each one waits for the previous to finish
   * plus a 1.5-second gap, so we never flood the API.
   * Throws on any failure so callers can fall back to email.
   */
  sendWhatsApp(to: string, message: string): Promise<void> {
    // Attach this send to the tail of the queue
    const result = this.sendQueue.then(() => this.doSendWhatsApp(to, message));

    // Advance the queue pointer; always wait SEND_GAP_MS after this slot
    // regardless of success/failure, so subsequent sends are never blocked
    this.sendQueue = result
      .then(() => this.delay(SmsService.SEND_GAP_MS))
      .catch(() => this.delay(SmsService.SEND_GAP_MS));

    // Return the raw result so the caller gets the real resolve/reject
    return result;
  }

  // Internal: the real send logic (no queue awareness)
  private async doSendWhatsApp(to: string, message: string): Promise<void> {
    const apiKey = this.config.get<string>('T7KM_API_KEY');
    if (!apiKey) throw new Error('T7KM_API_KEY is not configured');

    const online = await this.checkOnline();
    if (!online) throw new Error('WhatsApp device is not connected (check t7km dashboard to scan QR)');

    const number = this.normalisePhone(to);
    this.logger.debug(`Sending WhatsApp OTP to normalised number: ${number.slice(0, 4)}***`);

    const url     = 'https://wac.t7km.com/api/whats/sendMessage';
    const payload = JSON.stringify({ number, message });

    const resp   = await this.httpPostJson(url, payload, { 'X-API-Key': apiKey });
    const parsed = JSON.parse(resp) as { isSuccess: boolean; message: string | null };

    if (!parsed.isSuccess) throw new Error(`t7km API error: ${parsed.message ?? 'isSuccess=false'}`);

    this.logger.log(`WhatsApp sent to ${number.slice(0, 4)}*** via t7km`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  // --- Helpers --------------------------------------------------------------

  /**
   * Normalise any phone number to digits-only international format (no '+').
   * Internal zeros are NEVER removed — only non-digit characters are stripped
   * and a country-code prefix is added when missing.
   *
   *   '+49 160 99858405'  →  '4916099858405'   (international, kept as-is)
   *   '+201012345678'     →  '201012345678'    (Egypt with +, kept as-is)
   *   '201012345678'      →  '201012345678'    (Egypt with CC, kept as-is)
   *   '01014676645'       →  '201014676645'    (Egypt local: prepend '2', keep the '0')
   *   '1014676645'        →  '201014676645'    (Egypt local no leading 0: prepend '20')
   *
   * The '0' inside numbers like 1014676645 (Vodafone 10-prefix) is ALWAYS preserved.
   */
  normalisePhone(phone: string): string {
    // Step 1: strip leading + if present, then remove all non-digit characters
    const stripped = phone.trim();

    if (stripped.startsWith('+')) {
      return stripped.replace(/\D/g, '');
    }

    // Keep only digits — spaces, dashes, dots removed; no digit (incl. 0) is ever dropped
    const digits = stripped.replace(/\D/g, '');

    // Already has full country code (e.g. 201014676645 = 12 digits for Egypt)
    if (digits.length >= 12 && !digits.startsWith('0')) return digits;

    // Egyptian local with trunk zero: 01XXXXXXXXX (11 digits)
    // → prepend '2', trunk '0' is kept, giving 20 + 1XXXXXXXXX
    if (digits.startsWith('0') && digits.length === 11) return `2${digits}`;

    // Egyptian local without trunk zero: 1XXXXXXXXX (10 digits)
    // → prepend '20' directly
    if (digits.length === 10 && !digits.startsWith('0')) return `20${digits}`;

    // Other numbers already carrying a country code (11 digits, no leading 0)
    if (digits.length >= 11 && !digits.startsWith('0')) return digits;

    return digits;
  }

  private httpGetJson(
    url: string,
    headers: Record<string, string>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port:     parsedUrl.port || 443,
        path:     `${parsedUrl.pathname}${parsedUrl.search}`,
        method:   'GET',
        headers:  { accept: '*/*', ...headers },
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk; });
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(8_000, () => req.destroy(new Error('t7km GET timed out')));
      req.end();
    });
  }

  private httpPostJson(
    url: string,
    body: string,
    headers: Record<string, string>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port:     parsedUrl.port || 443,
        path:     `${parsedUrl.pathname}${parsedUrl.search}`,
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
          accept:           '*/*',
          ...headers,
        },
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`t7km HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          } else {
            resolve(data);
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(10_000, () => {
        req.destroy(new Error('t7km request timed out after 10 s'));
      });
      req.write(body);
      req.end();
    });
  }
}
