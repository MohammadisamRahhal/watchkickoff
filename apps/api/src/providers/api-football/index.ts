/**
 * API-Football provider barrel.
 * Exports the concrete adapter that implements IFootballProvider.
 * Only infrastructure/http/ and workers should import from this path.
 */
export { ApiFootballAdapter } from './adapter.js';
