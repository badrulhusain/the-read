import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { PublicReadCache } from './common/cache/public-read-cache';
import { PublicReadCacheInterceptor } from './common/cache/public-read-cache.interceptor';

type Runtime = { app: INestApplication; server: express.Express };
let runtime: Promise<Runtime> | undefined;

export async function createRuntime(): Promise<Runtime> {
  const server = express();
  server.disable('x-powered-by');
  server.set('trust proxy', 1);

  // Disable Nest's default parser so our explicit limits apply to every request.
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bodyParser: false,
    abortOnError: false,
    logger: ['error', 'warn'],
  });
  try {
    server.use(express.json({ limit: '1mb' }));
    server.use(express.urlencoded({ extended: true, limit: '1mb' }));
    server.use(helmet());
    server.use((_req, res, next) => {
      // Public controllers can explicitly opt into their existing CDN cache rules.
      res.setHeader('Cache-Control', 'private, no-store');
      next();
    });
    app.setGlobalPrefix('api');
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));
    app.useGlobalInterceptors(
      new RequestLoggingInterceptor(),
      new PublicReadCacheInterceptor(reflector, app.get(PublicReadCache)),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    // No listen(), process signal handlers, timers, or network hop to another app.
    await app.init();
    return { app, server };
  } catch (error) {
    await app.close();
    throw error;
  }
}

function getRuntime(): Promise<Runtime> {
  if (!runtime) {
    runtime = createRuntime().catch((error: unknown) => {
      // A transient initialization failure must not poison this warm instance.
      runtime = undefined;
      throw error;
    });
  }
  return runtime;
}

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const { server } = await getRuntime();
  await new Promise<void>((resolve, reject) => {
    res.once('finish', resolve);
    res.once('close', resolve);
    res.once('error', reject);
    server(req as Request, res as Response);
  });
}
