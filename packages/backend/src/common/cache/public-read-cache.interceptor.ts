import {
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { from, lastValueFrom, type Observable, tap } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PublicReadCache } from './public-read-cache';

const PUBLIC_CACHE_SECONDS = 'public_read_cache_seconds';
export const CachePublicRead = (seconds = 15) =>
  SetMetadata(PUBLIC_CACHE_SECONDS, seconds);

export class PublicReadCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: PublicReadCache,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const path = request.originalUrl.split('?')[0];
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method) ||
      path === '/api/internal/maintenance'
    ) {
      return next.handle().pipe(tap(() => this.cache.clear()));
    }

    const targets = [context.getHandler(), context.getClass()];
    const seconds = this.reflector.getAllAndOverride<number>(
      PUBLIC_CACHE_SECONDS,
      targets,
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    );
    if (request.method !== 'GET' || !isPublic || !seconds) return next.handle();

    const cached = this.cache.load(request.originalUrl, seconds, () =>
      lastValueFrom(next.handle()),
    );
    response.setHeader('X-Data-Cache', cached.state);
    // Keep browser/CDN content caching disabled: writes invalidate this instance
    // immediately; other instances can retain published data for at most the TTL.
    return from(cached.promise);
  }
}
