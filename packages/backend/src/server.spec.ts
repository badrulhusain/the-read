import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createRuntime } from './server';
import { PrismaService } from './database/prisma.service';

describe('Next.js API runtime', () => {
  let app: INestApplication;
  let server: Awaited<ReturnType<typeof createRuntime>>['server'];
  const originalDatabase = process.env.DATABASE_URL;
  const originalJwt = process.env.JWT_ACCESS_SECRET;

  beforeAll(async () => {
    // A real Nest/Express runtime; only the readiness query is stubbed.
    process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
    process.env.JWT_ACCESS_SECRET = 'unit-test-only-runtime-secret';
    ({ app, server } = await createRuntime());
    jest
      .spyOn(app.get(PrismaService), '$queryRaw')
      .mockResolvedValue([{ value: 1 }]);
  });

  afterAll(async () => {
    await app?.close();
    if (originalDatabase === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabase;
    if (originalJwt === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = originalJwt;
  });

  it('serves readiness from the original API path', async () => {
    const response = await request(server).get('/api/health').expect(200);
    expect(response.body).toMatchObject({ status: 'ok', database: 'ok' });
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('retains auth guards for protected routes', async () => {
    await request(server).get('/api/admin/users').expect(401);
    await request(server).get('/api/auth/me').expect(401);
  });

  it('parses query parameters and rejects invalid DTOs without querying the database', async () => {
    const response = await request(server)
      .get('/api/blogs?limit=0')
      .expect(400);
    expect((response.body as { message: string[] }).message).toContain(
      'limit must not be less than 1',
    );
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('retains body validation and forbids unknown fields', async () => {
    const response = await request(server)
      .post('/api/auth/login')
      .send({ email: 'invalid', password: '', role: 'ADMIN' })
      .expect(400);
    expect((response.body as { message: string[] }).message).toContain(
      'property role should not exist',
    );
  });

  it('supports the unchanged UI category and tag ID filters', async () => {
    const prisma = app.get(PrismaService);
    const findMany = jest.spyOn(prisma.blog, 'findMany').mockResolvedValue([]);
    const count = jest.spyOn(prisma.blog, 'count').mockResolvedValue(0);
    try {
      await request(server)
        .get('/api/blogs?categoryId=category-1&tagId=tag-1')
        .expect(200);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'category-1',
            tags: { some: { tagId: 'tag-1' } },
          }),
        }),
      );
    } finally {
      findMany.mockRestore();
      count.mockRestore();
    }
  });

  it('accepts multipart dispatch and still enforces auth', async () => {
    await request(server)
      .post('/api/uploads/image')
      .field('type', 'PROFILE_IMAGE')
      .attach('file', Buffer.from('test'), 'test.png')
      .expect(401);
  });

  it('returns JSON for unknown API routes', async () => {
    const response = await request(server).get('/api/not-a-route').expect(404);
    expect((response.body as { statusCode: number }).statusCode).toBe(404);
  });

  it('enforces the JSON size limit', async () => {
    const response = await request(server)
      .post('/api/auth/login')
      .send({ payload: 'x'.repeat(1024 * 1024) })
      .expect(413);
    expect((response.body as { message: string }).message).toBe(
      'Request body is too large',
    );
  });

  it('returns a client error for malformed JSON', async () => {
    await request(server)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{invalid')
      .expect(400);
  });
});
