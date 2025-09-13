// Mock Redis client for development (when Redis is not available)
const mockStore = new Map<string, { value: string; expires?: number }>();

export const redisClient = {
  // Mock client methods for development
  on: () => {},
  connect: () => Promise.resolve(),
  get: (key: string) => {
    const item = mockStore.get(key);
    if (item && item.expires && item.expires < Date.now()) {
      mockStore.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(item?.value || null);
  },
  set: (key: string, value: string) => {
    mockStore.set(key, { value });
    return Promise.resolve('OK');
  },
  setEx: (key: string, seconds: number, value: string) => {
    const expires = Date.now() + seconds * 1000;
    mockStore.set(key, { value, expires });
    return Promise.resolve('OK');
  },
  del: (key: string) => {
    mockStore.delete(key);
    return Promise.resolve(1);
  },
  quit: () => Promise.resolve(),
};

