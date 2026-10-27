import { PublicReadCache } from './public-read-cache';

describe('public read cache', () => {
  let cache: PublicReadCache;

  beforeEach(() => {
    cache = new PublicReadCache();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('shares concurrent reads and expires completed responses', async () => {
    const loader = jest.fn().mockResolvedValue({ articles: [1] });
    const first = cache.load('/blogs', 15, loader);
    const concurrent = cache.load('/blogs', 15, loader);
    expect(first.state).toBe('MISS');
    expect(concurrent.state).toBe('SHARED');
    expect(await first.promise).toEqual(await concurrent.promise);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(cache.load('/blogs', 15, loader).state).toBe('HIT');

    jest.advanceTimersByTime(15001);
    expect(cache.load('/blogs', 15, loader).state).toBe('MISS');
    await Promise.resolve();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const loader = jest.fn().mockRejectedValueOnce(new Error('Database down'));
    await expect(cache.load('/blogs', 15, loader).promise).rejects.toThrow(
      'Database down',
    );
    loader.mockResolvedValue({ articles: [] });
    expect(cache.load('/blogs', 15, loader).state).toBe('MISS');
    await Promise.resolve();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('does not restore old data when a write invalidates an in-flight read', async () => {
    let finish!: (value: string) => void;
    const pending = new Promise<string>((resolve) => {
      finish = resolve;
    });
    const oldRead = cache.load('/blogs', 15, () => pending);
    await Promise.resolve();
    cache.clear();
    const newRead = cache.load('/blogs', 15, () =>
      Promise.resolve('new article'),
    );
    await newRead.promise;
    finish('old article');
    await oldRead.promise;
    expect(
      await cache.load('/blogs', 15, () => Promise.resolve('unexpected'))
        .promise,
    ).toBe('new article');
  });

  it('keeps filter URLs separate', async () => {
    await cache.load('/blogs?tagId=one', 15, () => Promise.resolve('one'))
      .promise;
    expect(
      cache.load('/blogs?tagId=two', 15, () => Promise.resolve('two')).state,
    ).toBe('MISS');
  });

  it('limits memory for large results and many query variants', async () => {
    const large = () => Promise.resolve('x'.repeat(513 * 1024));
    await cache.load('/large', 15, large).promise;
    expect(cache.load('/large', 15, large).state).toBe('MISS');
    for (let index = 0; index < 65; index++) {
      await cache.load(`/blogs?page=${index}`, 15, () => Promise.resolve(index))
        .promise;
    }
    expect(
      cache.load('/blogs?page=0', 15, () => Promise.resolve(0)).state,
    ).toBe('MISS');
  });
});
