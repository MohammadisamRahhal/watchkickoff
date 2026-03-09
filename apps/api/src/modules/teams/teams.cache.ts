import { redis } from '@infrastructure/redis/client.js';
import { TTL } from '@infrastructure/redis/ttl.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('teams-cache');

export const teamsCache = {
  _logger: logger,

  async getTeam(slug: string): Promise<any | null> {
    try {
      const raw = await redis.get(`teams:slug:${slug}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  async setTeam(slug: string, data: any): Promise<void> {
    try { await redis.set(`teams:slug:${slug}`, JSON.stringify(data), 'EX', TTL.TEAM); }
    catch { /* ignore */ }
  },
};
