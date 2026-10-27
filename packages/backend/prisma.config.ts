import { loadEnvConfig } from '@next/env';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

// npm workspaces execute commands from the package directory.
loadEnvConfig(resolve(__dirname, '../..'), process.env.NODE_ENV !== 'production');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
