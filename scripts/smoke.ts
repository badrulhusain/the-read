import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

async function main() {
  const port = process.env.SMOKE_PORT ?? '3100';
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [
    path.resolve('node_modules/next/dist/bin/next'), 'start', '-p', port,
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      // The smoke test deliberately never connects to the production database.
      DATABASE_URL: 'postgresql://smoke:smoke@127.0.0.1:1/smoke',
      JWT_ACCESS_SECRET: 'smoke-test-only-access-secret',
      CRON_SECRET: 'smoke-test-only-cron-secret',
      NODE_ENV: 'production',
    },
  });
  let logs = '';
  server.stdout.on('data', (chunk: Buffer) => { logs += chunk.toString(); });
  server.stderr.on('data', (chunk: Buffer) => { logs += chunk.toString(); });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null) throw new Error(logs);
      try {
        if ((await fetch(origin)).ok) { ready = true; break; }
      } catch { /* wait until Next is listening */ }
      await delay(500);
    }
    assert.ok(ready, 'Production server did not become ready');
    for (const url of ['/', '/blogs', '/blogs/example-article', '/login', '/admin', '/editor/articles/new']) {
      const response = await fetch(origin + url);
      assert.equal(response.status, 200, `${url} must serve the static UI shell`);
      assert.match(await response.text(), /<title\b[^>]*>The Read<\/title>/);
    }
    const checks = [
      ['/api/admin/users', 401, undefined],
      ['/api/blogs?limit=0', 400, undefined],
      ['/api/blogs?unexpected=field', 400, undefined],
      ['/api/auth/login', 400, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'invalid', password: '' }) }],
      ['/api/uploads/image', 401, { method: 'POST', body: new FormData() }],
      ['/api/internal/maintenance', 401, undefined],
      ['/api/unknown-route', 404, undefined],
      ['/api/health', 503, undefined],
    ] as const;
    for (const [url, status, options] of checks) {
      const response = await fetch(origin + url, options);
      assert.equal(response.status, status, `${url}: ${await response.text()}`);
      assert.match(response.headers.get('content-type') ?? '', /application\/json/);
      assert.match(response.headers.get('cache-control') ?? '', /no-store/);
      console.log(`PASS ${url} (${status})`);
    }
    console.log('Production UI routes, API dispatch, validation, auth, multipart, cron protection, and database failure response passed.');
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    if (server.exitCode === null) {
      server.kill();
      await once(server, 'exit');
    }
  }
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
