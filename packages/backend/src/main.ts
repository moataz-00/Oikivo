import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import * as jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { existsSync } from 'fs';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { PropertyEntity } from './entities/property.entity';
import { UserEntity } from './entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
  });

  const configuredOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = configuredOrigins.length
    ? configuredOrigins
    : [
        'http://localhost:3000', // web
        'http://127.0.0.1:3000',
        'http://localhost:3001', // backend swagger
        'http://localhost:3002', // admin panel
        'http://127.0.0.1:3002',
      ];

  // Global prefix
  app.setGlobalPrefix('api');

  // Cookie parser (required for httpOnly cookie auth)
  app.use(cookieParser());

  // Gzip/Brotli response compression
  app.use(compression());

  // Security headers (S3: Helmet + CSP)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://maps.googleapis.com'],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: ["'self'", ...allowedOrigins, 'https://maps.googleapis.com'],
          frameSrc: ["'self'", 'https://maps.googleapis.com'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow cross-origin images (property photos, maps tiles)
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow CDN / Next.js image optimization
    }),
  );

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Trust first proxy (nginx/Cloudflare) so req.ip reflects real client IP
  app.set('trust proxy', 1);

  // Protect sensitive file directories — require valid JWT before serving
  // Files must be accessed through authenticated controller endpoints instead:
  // - Payment proofs: GET /api/bookings/:id/payment-proof/:filename
  // - Message images: GET /api/messages/conversations/:id/image/:filename
  // - ID documents: GET /api/users/:id/id-document/:filename
  // - Consultant docs: Already protected below
  const jwtSecret = process.env.JWT_SECRET;
  const dataSource = app.get(DataSource);
  const propertyRepo = dataSource.getRepository(PropertyEntity);
  const usersRepo = dataSource.getRepository(UserEntity);

  // Published listing photos are public. Draft/pending/archived photos require host/admin auth.
  // In-memory cache of published property IDs to avoid DB hit per image request.
  const publishedPropertyCache = new Map<number, { status: string; hostId: number; cachedAt: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async function getPropertyCached(id: number) {
    const cached = publishedPropertyCache.get(id);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) return cached;
    const p = await propertyRepo.findOne({ where: { id }, select: ['id', 'status', 'hostId'] });
    if (!p) return null;
    const entry = { status: p.status, hostId: p.hostId, cachedAt: Date.now() };
    publishedPropertyCache.set(id, entry);
    // Cap cache size to prevent unbounded memory
    if (publishedPropertyCache.size > 5000) {
      const oldest = publishedPropertyCache.keys().next().value;
      if (oldest !== undefined) publishedPropertyCache.delete(oldest);
    }
    return entry;
  }

  app.use('/uploads/properties', async (req: any, res: any, next: any) => {
    const match = req.path?.match(/^\/(\d+)\//);
    if (!match) return next();

    const propertyId = Number(match[1]);
    if (!Number.isFinite(propertyId) || propertyId <= 0) return next();

    const property = await getPropertyCached(propertyId);
    if (!property) {
      return res.status(404).json({ statusCode: 404, message: 'Property not found' });
    }

    if (property.status === 'published') return next();

    // Allow requests from the local Next.js server (image optimization, SSR).
    // Next.js fetches upstream images server-to-server without cookies.
    // Page-level auth is handled by the frontend — the URL is only known
    // to the host viewing their own listing in the create/edit/verify flow.
    const reqIp = req.ip ?? req.connection?.remoteAddress ?? '';
    const isLocal = reqIp === '127.0.0.1' || reqIp === '::1' || reqIp === '::ffff:127.0.0.1';
    if (isLocal) return next();

    const authHeader: string | undefined = req.headers?.authorization;
    const token: string | undefined =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined) ??
      req.cookies?.access_token;

    if (!token || !jwtSecret) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    try {
      const payload: any = jwt.verify(token, jwtSecret);
      const userId = Number(payload?.sub ?? payload?.id ?? payload?.userId);
      if (!Number.isFinite(userId) || userId <= 0) {
        return res.status(401).json({ statusCode: 401, message: 'Invalid token payload' });
      }

      if (userId === property.hostId) return next();
      if (payload?.isAdmin === true) return next();

      const user = await usersRepo.findOne({ where: { id: userId } });
      if (user?.isAdmin) return next();

      return res.status(403).json({ statusCode: 403, message: 'Forbidden' });
    } catch {
      return res.status(401).json({ statusCode: 401, message: 'Invalid or expired token' });
    }
  });
  
  const authenticatedDirectories = [
    '/uploads/payments',
    '/uploads/messages',
    '/uploads/id-documents',
    '/uploads/consultant-docs',
    '/uploads/disputes', // FIX O9: Dispute evidence requires authentication
  ];

  authenticatedDirectories.forEach((dir) => {
    app.use(dir, (req: any, res: any, next: any) => {
      const authHeader: string | undefined = req.headers?.authorization;
      const token: string | undefined =
        (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined) ??
        req.cookies?.access_token;
      if (!token || !jwtSecret) {
        return res.status(401).json({ statusCode: 401, message: 'Unauthorized - use authenticated endpoint' });
      }
      try {
        jwt.verify(token, jwtSecret);
        // Authentication passed but deny direct access - must use controller endpoints
        return res.status(403).json({ 
          statusCode: 403, 
          message: 'Direct access forbidden - use authenticated API endpoints',
          hint: dir === '/uploads/payments' 
            ? 'Use GET /api/bookings/:id/payment-proof/:filename' 
            : dir === '/uploads/messages'
            ? 'Use GET /api/messages/conversations/:id/image/:filename'
            : dir === '/uploads/id-documents'
            ? 'Use GET /api/users/:id/id-document/:filename'
            : 'Use authenticated endpoint'
        });
      } catch {
        return res.status(401).json({ statusCode: 401, message: 'Invalid or expired token' });
      }
    });
  });

  // On-the-fly image optimization for property photos (sharp).
  // Supports ?w=320&f=webp&q=80 query params. Falls through to static serving if no params.
  app.use('/uploads/properties', (req: any, res: any, next: any) => {
    const w = parseInt(req.query.w);
    const h = parseInt(req.query.h);
    const f = (req.query.f as string)?.toLowerCase();
    if (!w && !h && !f) return next();

    const width = w > 0 && w <= 2000 ? w : undefined;
    const height = h > 0 && h <= 2000 ? h : undefined;
    const quality = Math.min(Math.max(parseInt(req.query.q) || 80, 1), 100);

    const acceptHeader = req.headers.accept || '';
    let format: 'webp' | 'avif' | 'jpeg' | 'png' = 'jpeg';
    if (f === 'webp' || f === 'avif' || f === 'jpeg' || f === 'png') format = f;
    else if (acceptHeader.includes('image/avif')) format = 'avif';
    else if (acceptHeader.includes('image/webp')) format = 'webp';

    const filePath = join(__dirname, '..', 'uploads', 'properties', req.path);
    if (!existsSync(filePath)) return next();

    const contentTypes: Record<string, string> = { webp: 'image/webp', avif: 'image/avif', jpeg: 'image/jpeg', png: 'image/png' };

    let transform = sharp(filePath);
    if (width || height) transform = transform.resize(width, height, { fit: 'inside', withoutEnlargement: true });

    switch (format) {
      case 'webp': transform = transform.webp({ quality }); break;
      case 'avif': transform = transform.avif({ quality }); break;
      case 'png':  transform = transform.png({ quality }); break;
      default:     transform = transform.jpeg({ quality, mozjpeg: true }); break;
    }

    transform.toBuffer()
      .then((buffer: Buffer) => {
        res.set('Content-Type', contentTypes[format]);
        res.set('Cache-Control', 'public, max-age=2592000, immutable');
        res.set('Vary', 'Accept');
        res.send(buffer);
      })
      .catch(() => next());
  });

  // Serve uploaded files (except protected directories above)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days cache for property images
    immutable: true,
    etag: true,
    lastModified: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger — disabled in production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Sakan API')
      .setDescription('Sakan (سكن) — Airbnb-clone platform REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication')
      .addTag('users', 'User profiles')
      .addTag('properties', 'Property listings')
      .addTag('search', 'Search & discovery')
      .addTag('bookings', 'Booking management')
      .addTag('reviews', 'Reviews')
      .addTag('messages', 'Messaging')
      .addTag('wishlists', 'Wishlists')
      .addTag('categories', 'Categories')
      .addTag('amenities', 'Amenities')
      .addTag('notifications', 'Notifications')
      .addTag('availability', 'Property availability & calendar')
      .addTag('admin', 'Admin panel')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🏠 Sakan API running at http://localhost:${port}/api`);
  console.log(`📖 Swagger docs at  http://localhost:${port}/api/docs\n`);
}

bootstrap();
