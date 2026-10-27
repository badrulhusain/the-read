import { Injectable } from '@nestjs/common';

type CacheEntry = {
  promise: Promise<unknown>;
  pending: boolean;
  expiresAt: number;
};

@Injectable()
export class PublicReadCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly maxEntries = 64;
  private readonly maxEntryBytes = 512 * 1024;

  clear(): void {
    this.entries.clear();
  }

  load<T>(key: string, ttlSeconds: number, loader: () => Promise<T>) {
    const existing = this.entries.get(key);
    if (existing && (existing.pending || existing.expiresAt > Date.now())) {
      this.entries.delete(key);
      this.entries.set(key, existing);
      return {
        state: existing.pending ? 'SHARED' : 'HIT',
        promise: existing.promise as Promise<T>,
      };
    }
    this.entries.delete(key);
    while (this.entries.size >= this.maxEntries) {
      const [oldest] = this.entries.keys();
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }

    const entry: CacheEntry = {
      pending: true,
      expiresAt: 0,
      promise: Promise.resolve(),
    };
    const promise = Promise.resolve()
      .then(loader)
      .then(
        (value) => {
          if (this.entries.get(key) === entry) {
            let cacheable = false;
            try {
              cacheable =
                Buffer.byteLength(JSON.stringify(value)) <= this.maxEntryBytes;
            } catch {
              // Non-JSON values must not become cached public responses.
            }
            if (cacheable) {
              entry.pending = false;
              entry.expiresAt = Date.now() + ttlSeconds * 1000;
            } else {
              this.entries.delete(key);
            }
          }
          return value;
        },
        (error: unknown) => {
          if (this.entries.get(key) === entry) this.entries.delete(key);
          throw error;
        },
      );
    entry.promise = promise;
    this.entries.set(key, entry);
    return { state: 'MISS', promise };
  }
}
