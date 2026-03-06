/**
 * Matches module — Redis caching layer.
 */
import { redis } from '@infrastructure/redis/client.js';
import { RedisKeys } from '@infrastructure/redis/keys.js';
import { TTL } from '@infrastructure/redis/ttl.js';
import { createLogger } from '@core/logger.js';
import type { MatchResponse } from './matches.types.js';

const logger = createLogger('matches-cache');

export const matchesCache = {

  async getTodayMatches(date: string): Promise<MatchResponse[] | null> {
    try {
      const raw = await redis.get(RedisKeys.homeToday(date));
      return raw ? (JSON.parse(raw) as MatchResponse[]) : null;
    } catch (err) { logger.warn({ err }, 'Cache read failed'); return null; }
  },

  async setTodayMatches(date: string, data: MatchResponse[]): Promise<void> {
    try {
      await redis.set(RedisKeys.homeToday(date), JSON.stringify(data), 'EX', TTL.HOME_TODAY);
    } catch (err) { logger.warn({ err }, 'Cache write failed'); }
  },

  async getLiveMatches(): Promise<MatchResponse[] | null> {
    try {
      const raw = await redis.get('matches:live:all');
      return raw ? (JSON.parse(raw) as MatchResponse[]) : null;
    } catch (err) { logger.warn({ err }, 'Cache read failed'); return null; }
  },

  async setLiveMatches(data: MatchResponse[]): Promise<void> {
    try {
      await redis.set('matches:live:all', JSON.stringify(data), 'EX', TTL.MATCH_LIVE);
    } catch (err) { logger.warn({ err }, 'Cache write failed'); }
  },

  async getMatch(id: string): Promise<MatchResponse | null> {
    try {
      const raw = await redis.get(RedisKeys.matchStatic(id));
      return raw ? (JSON.parse(raw) as MatchResponse) : null;
    } catch (err) { logger.warn({ err }, 'Cache read failed'); return null; }
  },

  async setMatch(id: string, data: MatchResponse): Promise<void> {
    try {
      await redis.set(RedisKeys.matchStatic(id), JSON.stringify(data), 'EX', TTL.MATCH_STATIC);
    } catch (err) { logger.warn({ err }, 'Cache write failed'); }
  },

  async invalidateTodayMatches(date: string): Promise<void> {
    try {
      await redis.del(RedisKeys.homeToday(date));
      await redis.del('matches:live:all');
    } catch (err) { logger.warn({ err }, 'Cache invalidation failed'); }
  },
};
