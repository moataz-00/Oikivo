import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
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

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

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
  app.use('/uploads/properties', async (req: any, res: any, next: any) => {
    const match = req.path?.match(/^\/(\d+)\//);
    if (!match) return next();

    const propertyId = Number(match[1]);
    if (!Number.isFinite(propertyId) || propertyId <= 0) return next();

    const property = await propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) {
      return res.status(404).json({ statusCode: 404, message: 'Property not found' });
    }

    if (property.status === 'published') return next();

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

  // Serve uploaded files (except protected directories above)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
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

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🏠 Sakan API running at http://localhost:${port}/api`);
  console.log(`📖 Swagger docs at  http://localhost:${port}/api/docs\n`);
}

bootstrap();
