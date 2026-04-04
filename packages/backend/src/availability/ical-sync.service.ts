import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as https from 'https';
import * as http from 'http';
import { ICalSourceEntity } from '../entities/ical-source.entity';
import { AvailabilityEntity } from '../entities/availability.entity';
import { PropertyEntity } from '../entities/property.entity';

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

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = (client as typeof https).get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow single redirect
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (!res.statusCode || res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode ?? 'unknown'} fetching iCal feed`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
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

  constructor(
    @InjectRepository(ICalSourceEntity)
    private sourcesRepo: Repository<ICalSourceEntity>,
    @InjectRepository(AvailabilityEntity)
    private availabilityRepo: Repository<AvailabilityEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
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

    // Validate it looks like an iCal URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new BadRequestException('URL must start with http:// or https://');
    }

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
      source: 'ical',
      isBlocked: true,
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

  async syncSource(source: ICalSourceEntity): Promise<ICalSourceEntity> {
    await this.sourcesRepo.update(source.id, { syncStatus: 'syncing', errorMessage: null });

    try {
      const raw = await fetchUrl(source.url);
      const events = parseICalFeed(raw);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Remove all existing ical-blocked dates for this property (refresh)
      await this.availabilityRepo.delete({
        propertyId: source.propertyId,
        source: 'ical',
      });

      // Re-insert blocked dates from the feed — future dates only
      const toSave: AvailabilityEntity[] = [];
      for (const event of events) {
        const end = new Date(event.end); // DTEND is exclusive in iCal
        for (let d = new Date(event.start); d < end; d.setDate(d.getDate() + 1)) {
          if (d < today) continue; // skip past dates
          const date = d.toISOString().split('T')[0];

          // Either upsert or create
          let row = await this.availabilityRepo.findOne({
            where: { propertyId: source.propertyId, date },
          });
          if (row) {
            row.isBlocked = true;
            row.source = 'ical';
          } else {
            row = this.availabilityRepo.create({
              propertyId: source.propertyId,
              date,
              isBlocked: true,
              source: 'ical',
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
      const end = endDate.toISOString().split('T')[0].replace(/-/g, '');
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
      'PRODID:-//Journey Stay//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...vevents,
      'END:VCALENDAR',
    ].join('\r\n');
  }
}
