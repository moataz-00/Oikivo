import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * Serves optimized property images on-the-fly using sharp.
 *
 * Query params:
 *   ?w=320      — resize width (default: original)
 *   ?h=240      — resize height (default: auto)
 *   ?q=80       — quality 1-100 (default: 80)
 *   ?f=webp     — format: webp | avif | jpeg | png (default: auto from Accept header)
 *
 * Caches optimized images in-memory (LRU, 100 MB cap).
 * Falls through to static middleware if no optimization params.
 */
@Injectable()
export class ImageOptimizationMiddleware implements NestMiddleware {
  private readonly logger = new Logger('ImageOptimization');

  // Simple in-memory LRU cache: key → { buffer, contentType }
  private readonly cache = new Map<string, { buffer: Buffer; contentType: string }>();
  private cacheBytes = 0;
  private readonly MAX_CACHE_BYTES = 100 * 1024 * 1024; // 100 MB

  use(req: Request, res: Response, next: NextFunction) {
    const w = parseInt(req.query.w as string);
    const h = parseInt(req.query.h as string);
    const q = parseInt(req.query.q as string) || 80;
    const f = (req.query.f as string)?.toLowerCase();

    // If no optimization params, fall through to static serving
    if (!w && !h && !f) return next();

    // Clamp params
    const width = w && w > 0 && w <= 2000 ? w : undefined;
    const height = h && h > 0 && h <= 2000 ? h : undefined;
    const quality = Math.min(Math.max(q, 1), 100);

    // Determine output format
    const acceptHeader = req.headers.accept || '';
    let format: 'webp' | 'avif' | 'jpeg' | 'png' = 'jpeg';
    if (f === 'webp' || f === 'avif' || f === 'jpeg' || f === 'png') {
      format = f;
    } else if (acceptHeader.includes('image/avif')) {
      format = 'avif';
    } else if (acceptHeader.includes('image/webp')) {
      format = 'webp';
    }

    // Build cache key
    const cacheKey = `${req.path}|${width}|${height}|${quality}|${format}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      res.set('Content-Type', cached.contentType);
      res.set('Cache-Control', 'public, max-age=2592000, immutable');
      res.set('X-Image-Cache', 'HIT');
      return res.send(cached.buffer);
    }

    // Resolve file path — req.path is relative to the mount point (/uploads/properties)
    const filePath = join(process.cwd(), 'uploads', 'properties', req.path);
    if (!existsSync(filePath)) return next();

    const contentTypes: Record<string, string> = {
      webp: 'image/webp',
      avif: 'image/avif',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };

    try {
      let transform = sharp(filePath);

      if (width || height) {
        transform = transform.resize(width, height, { fit: 'inside', withoutEnlargement: true });
      }

      switch (format) {
        case 'webp': transform = transform.webp({ quality }); break;
        case 'avif': transform = transform.avif({ quality }); break;
        case 'png':  transform = transform.png({ quality }); break;
        default:     transform = transform.jpeg({ quality, mozjpeg: true }); break;
      }

      transform.toBuffer().then((buffer) => {
        // Evict oldest entries if cache is too large
        while (this.cacheBytes + buffer.length > this.MAX_CACHE_BYTES && this.cache.size > 0) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) {
            const entry = this.cache.get(firstKey);
            if (entry) this.cacheBytes -= entry.buffer.length;
            this.cache.delete(firstKey);
          }
        }

        this.cache.set(cacheKey, { buffer, contentType: contentTypes[format] });
        this.cacheBytes += buffer.length;

        res.set('Content-Type', contentTypes[format]);
        res.set('Cache-Control', 'public, max-age=2592000, immutable');
        res.set('X-Image-Cache', 'MISS');
        res.send(buffer);
      }).catch((err) => {
        this.logger.warn(`Sharp processing failed for ${req.path}: ${err.message}`);
        next();
      });
    } catch (err) {
      this.logger.warn(`Cannot process ${req.path}: ${(err as Error).message}`);
      next();
    }
  }
}
