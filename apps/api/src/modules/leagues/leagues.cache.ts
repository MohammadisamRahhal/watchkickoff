/**
 * Leagues cache helpers.
 */
import { redis } from '@infrastructure/redis/client.js';
import { RedisKeys } from '@infrastructure/redis/keys.js';
import { TTL } from '@infrastructure/redis/ttl.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('leagues-cache');

export const leaguesCache = {
  _logger: logger,

  async getAll(): Promise<any[] | null> {
    try {
      const raw = await redis.get('leagues:all');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  async setAll(data: any[]): Promise<void> {
    try { await redis.set('leagues:all', JSON.stringify(data), 'EX', TTL.LEAGUE_PROFILE); }
    catch { /* ignore */ }
  },

  async getLeague(slug: string): Promise<any | null> {
    try {
      const raw = await redis.get(`leagues:slug:${slug}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  async setLeague(slug: string, data: any): Promise<void> {
    try { await redis.set(`leagues:slug:${slug}`, JSON.stringify(data), 'EX', TTL.LEAGUE_PROFILE); }
    catch { /* ignore */ }
  },

  async getStandings(slug: string): Promise<any[] | null> {
    try {
      const raw = await redis.get(`leagues:standings:${slug}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  async setStandings(slug: string, data: any[]): Promise<void> {
    try { await redis.set(`leagues:standings:${slug}`, JSON.stringify(data), 'EX', TTL.LEAGUE_STANDINGS); }
    catch { /* ignore */ }
  },

  async invalidateLeague(slug: string): Promise<void> {
    try {
      await redis.del(`leagues:slug:${slug}`);
      await redis.del(`leagues:standings:${slug}`);
      await redis.del('leagues:all');
    } catch { /* ignore */ }
  },
};
