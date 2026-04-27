import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as https from 'https';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { ICalSourceEntity } from '../entities/ical-source.entity';
import { AvailabilityEntity } from '../entities/availability.entity';
import { PropertyEntity } from '../entities/property.entity';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Minimal iCal parser ─────────────────────────────────────────────────────

interface ICalEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
}

function parseICalDate(value: string): Date {
  // Strip TZID param if present: DTSTART;TZID=...:<value>
  const raw = value.includes(':') ? value.split(':').pop()! : value;
  const clean = raw.trim();
  if (clean.length === 8) {
    // DATE format: YYYYMMDD
    return new Date(
      parseInt(clean.slice(0, 4), 10),
      parseInt(clean.slice(4, 6), 10) - 1,
      parseInt(clean.slice(6, 8), 10),
    );
  }
  // DATETIME format: YYYYMMDDTHHMMSSz or YYYYMMDDTHHmmss
  const dt = clean.replace('Z', '');
  return new Date(
    parseInt(dt.slice(0, 4), 10),
    parseInt(dt.slice(4, 6), 10) - 1,
    parseInt(dt.slice(6, 8), 10),
    parseInt(dt.slice(9, 11), 10),
    parseInt(dt.slice(11, 13), 10),
    parseInt(dt.slice(13, 15), 10),
  );
}

function parseICalFeed(raw: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  // Un-fold continuation lines (RFC 5545 §3.1)
  const unfolded = raw.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const vevents = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
  for (const vevent of vevents) {
    const lines = vevent.split('\n');
    let uid = '';
    let summary = '';
    let start: Date | null = null;
    let end: Date | null = null;

    for (const line of lines) {
      if (line.startsWith('UID:')) uid = line.slice(4).trim();
      else if (line.startsWith('SUMMARY:')) summary = line.slice(8).trim();
      else if (line.startsWith('DTSTART')) {
        const val = line.includes(':') ? line.split(':').slice(1).join(':') : '';
        if (val) start = parseICalDate(val);
      } else if (line.startsWith('DTEND')) {
        const val = line.includes(':') ? line.split(':').slice(1).join(':') : '';
        if (val) end = parseICalDate(val);
      }
    }

    if (start && end && uid) {
      events.push({ uid, summary: summary || 'Blocked', start, end });
    }
  }

  return events;
}

const MAX_ICAL_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_REDIRECTS = 3;

function isPrivateOrLocalAddress(address: string): boolean {
  const ipVersion = isIP(address);
  if (ipVersion === 4) {
    const [a, b] = address.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  if (ipVersion === 6) {
    const v = address.toLowerCase();
    if (v === '::1') return true;
    if (v.startsWith('fe80:')) return true; // link-local
    if (v.startsWith('fc') || v.startsWith('fd')) return true; // unique local
    return false;
  }
  return true;
}

async function validateIcalUrlOrThrow(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('Invalid iCal URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new BadRequestException('iCal URL must use HTTPS');
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new BadRequestException('Localhost iCal URLs are not allowed');
  }

  const records = await lookup(host, { all: true, verbatim: true });
  if (!records.length) {
    throw new BadRequestException('Could not resolve iCal host');
  }

  for (const rec of records) {
    if (isPrivateOrLocalAddress(rec.address)) {
      throw new BadRequestException('Private/internal iCal hosts are not allowed');
    }
  }

  return parsed;
}

async function fetchUrl(url: string, redirectDepth = 0): Promise<string> {
  if (redirectDepth > MAX_REDIRECTS) {
    throw new Error('Too many redirects while fetching iCal feed');
  }

  const parsed = await validateIcalUrlOrThrow(url);

  return new Promise((resolve, reject) => {
    const req = https.get(parsed, { timeout: 15000, rejectUnauthorized: true }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirected = new URL(res.headers.location, parsed).toString();
        return fetchUrl(redirected, redirectDepth + 1).then(resolve).catch(reject);
      }
      if (!res.statusCode || res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode ?? 'unknown'} fetching iCal feed`));
      }

      const contentLength = Number(res.headers['content-length'] ?? 0);
      if (Number.isFinite(contentLength) && contentLength > MAX_ICAL_BYTES) {
        req.destroy();
        return reject(new Error('iCal feed too large (max 1MB)'));
      }

      const chunks: Buffer[] = [];
      let totalBytes = 0;
      res.on('data', (c: Buffer) => {
        totalBytes += c.length;
        if (totalBytes > MAX_ICAL_BYTES) {
          req.destroy();
          return reject(new Error('iCal feed too large (max 1MB)'));
        }
        chunks.push(c);
      });
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('iCal fetch timed out')); });
  });
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ICalSyncService {
  private readonly logger = new Logger(ICalSyncService.name);
  private readonly propertySyncLocks = new Set<number>();

  constructor(
    @InjectRepository(ICalSourceEntity)
    private sourcesRepo: Repository<ICalSourceEntity>,
    @InjectRepository(AvailabilityEntity)
    private availabilityRepo: Repository<AvailabilityEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    private notificationsService: NotificationsService,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async getSources(propertyId: number, hostId: number): Promise<ICalSourceEntity[]> {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== hostId) throw new ForbiddenException('Not your property');
    return this.sourcesRepo.find({ where: { propertyId } });
  }

  async addSource(
    propertyId: number,
    hostId: number,
    label: string,
    url: string,
  ): Promise<ICalSourceEntity> {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== hostId) throw new ForbiddenException('Not your property');

    await validateIcalUrlOrThrow(url);

    const source = this.sourcesRepo.create({ propertyId, label, url });
    const saved = await this.sourcesRepo.save(source);

    // Trigger immediate first sync in background (fire-and-forget)
    this.syncSource(saved).catch((err) =>
      this.logger.error(`Initial sync failed for source #${saved.id}: ${err.message}`),
    );

    return saved;
  }

  async removeSource(sourceId: number, hostId: number): Promise<void> {
    const source = await this.sourcesRepo.findOne({
      where: { id: sourceId },
      relations: ['property'],
    });
    if (!source) throw new NotFoundException('iCal source not found');
    if (source.property.hostId !== hostId) throw new ForbiddenException('Not your property');

    // Remove dates that were blocked specifically by this source
    // (We keep host-and booking-blocked dates untouched)
    await this.availabilityRepo.delete({
      propertyId: source.propertyId,
      icalSourceId: source.id,
    });

    await this.sourcesRepo.remove(source);
  }

  async triggerSync(sourceId: number, hostId: number): Promise<ICalSourceEntity> {
    const source = await this.sourcesRepo.findOne({
      where: { id: sourceId },
      relations: ['property'],
    });
    if (!source) throw new NotFoundException('iCal source not found');
    if (source.property.hostId !== hostId) throw new ForbiddenException('Not your property');
    return this.syncSource(source);
  }

  // ─── Sync logic ────────────────────────────────────────────────────────────

  private fmtLocal(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async syncSource(source: ICalSourceEntity): Promise<ICalSourceEntity> {
    if (this.propertySyncLocks.has(source.propertyId)) {
      throw new ConflictException('A calendar sync is already running for this property');
    }
    this.propertySyncLocks.add(source.propertyId);

    await this.sourcesRepo.update(source.id, { syncStatus: 'syncing', errorMessage: null });

    try {
      const raw = await fetchUrl(source.url);
      const events = parseICalFeed(raw);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Remove all existing ical-blocked dates for THIS feed only (refresh)
      await this.availabilityRepo.delete({
        icalSourceId: source.id,
      });

      // Re-insert blocked dates from the feed — future dates only
      const toSave: AvailabilityEntity[] = [];
      for (const event of events) {
        const end = new Date(event.end); // DTEND is exclusive in iCal
        for (let d = new Date(event.start); d < end; d.setDate(d.getDate() + 1)) {
          if (d < today) continue; // skip past dates
          const date = this.fmtLocal(d);

          // Either upsert or create
          let row = await this.availabilityRepo.findOne({
            where: { propertyId: source.propertyId, date },
          });
          if (row) {
            row.isBlocked = true;
            row.source = 'ical';
            row.icalSourceId = source.id;
          } else {
            row = this.availabilityRepo.create({
              propertyId: source.propertyId,
              date,
              isBlocked: true,
              source: 'ical',
              icalSourceId: source.id,
            });
          }
          toSave.push(row);
        }
      }

      if (toSave.length > 0) {
        await this.availabilityRepo.save(toSave);
      }

      await this.sourcesRepo.update(source.id, {
        syncStatus: 'success',
        lastSyncedAt: new Date(),
        errorMessage: null,
      });

      this.logger.log(
        `Synced iCal source #${source.id} (${source.label}) — ${events.length} event(s), ${toSave.length} day(s) blocked`,
      );
    } catch (err) {
      const msg = (err as Error).message;
      await this.sourcesRepo.update(source.id, {
        syncStatus: 'error',
        errorMessage: msg,
      });
      this.logger.error(`iCal sync failed for source #${source.id}: ${msg}`);

      // Notify the property host about the sync failure
      try {
        const property = await this.propertiesRepo.findOne({ where: { id: source.propertyId } });
        if (property) {
          await this.notificationsService.create(
            property.hostId,
            'ical_sync_error',
            'Calendar Sync Failed',
            'فشل مزامنة التقويم',
            `Could not sync calendar "${source.label}". Please check the feed URL is still valid.`,
            `تعذّر مزامنة التقويم "${source.label}". يرجى التحقق من أن رابط التغذية لا يزال صالحاً.`,
            { sourceId: source.id, propertyId: source.propertyId, error: msg },
          );
        }
      } catch (notifErr) {
        this.logger.warn(`Could not send sync-failure notification: ${(notifErr as Error).message}`);
      }
    }

    finally {
      this.propertySyncLocks.delete(source.propertyId);
    }

    return this.sourcesRepo.findOne({ where: { id: source.id } }) as Promise<ICalSourceEntity>;
  }

  /** Auto-sync all sources every 4 hours */
  @Cron('0 */4 * * *')
  async syncAll(): Promise<void> {
    this.logger.log('Running scheduled iCal sync for all sources');
    const sources = await this.sourcesRepo.find();
    for (const source of sources) {
      await this.syncSource(source).catch((err) =>
        this.logger.error(`Scheduled sync failed for source #${source.id}: ${err.message}`),
      );
    }
  }

  // ─── Admin methods ─────────────────────────────────────────────────────────

  /** Return all iCal sources across all properties with property info (admin only) */
  async getSourcesAdmin(): Promise<ICalSourceEntity[]> {
    return this.sourcesRepo.find({
      relations: ['property'],
      order: { propertyId: 'ASC', id: 'ASC' },
    });
  }

  /** Force-sync a single source by ID (admin only) */
  async syncSourceById(id: number): Promise<ICalSourceEntity> {
    const source = await this.sourcesRepo.findOne({ where: { id } });
    if (!source) throw new NotFoundException(`iCal source #${id} not found`);
    return this.syncSource(source);
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  /** Generate an iCal feed for a property (exports all blocked dates) */
  async exportIcal(propertyId: number): Promise<string> {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const rows = await this.availabilityRepo.find({
      where: { propertyId, isBlocked: true },
    });

    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const vevents = rows.map((row) => {
      const start = row.date.replace(/-/g, '');
      // iCal all-day: DTEND = next day
      const endDate = new Date(row.date);
      endDate.setDate(endDate.getDate() + 1);
      const end = this.fmtLocal(endDate).replace(/-/g, '');
      return [
        'BEGIN:VEVENT',
        `UID:${row.id}-${row.date}@journeystay`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:Not available`,
        'END:VEVENT',
      ].join('\r\n');
    });

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Oikivo//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...vevents,
      'END:VCALENDAR',
    ].join('\r\n');
  }
}
