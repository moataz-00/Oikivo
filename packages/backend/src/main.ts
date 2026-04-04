import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import { AppModule } from './app.module';

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

  // Protect consultant document uploads — require valid JWT before serving (S3)
  const jwtSecret = process.env.JWT_SECRET;
  app.use('/uploads/consultant-docs', (req: any, res: any, next: any) => {
    const authHeader: string | undefined = req.headers?.authorization;
    const token: string | undefined =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined) ??
      req.cookies?.access_token;
    if (!token || !jwtSecret) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }
    try {
      jwt.verify(token, jwtSecret);
      next();
    } catch {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }
  });

  // Serve uploaded files
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
