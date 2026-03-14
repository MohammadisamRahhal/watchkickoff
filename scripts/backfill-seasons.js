const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', user:'postgres', password:'WatchKick2026', database:'watchkickoff' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const delay = ms => new Promise(r => setTimeout(r, ms));

function fixCountryCode(code) {
  if (!code) return 'WW';
  if (code.length > 2) return code.substring(0, 2).toUpperCase();
  return code.toUpperCase();
}

async function main() {
  const { rows: leagues } = await pool.query(`
    SELECT DISTINCT ON ((provider_ref->>'apiFootball'))
      id, name, slug, season,
      provider_ref->>'apiFootball' AS api_id,
      provider_ref->>'logo' AS logo
    FROM leagues
    WHERE is_active = true
      AND provider_ref->>'apiFootball' IS NOT NULL
      AND season IN ('2025','2026')
    ORDER BY (provider_ref->>'apiFootball'), season DESC
  `);

  console.log('Found ' + leagues.length + ' unique leagues');
  let added = 0, skipped = 0, errors = 0;

  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];
    const apiId = league.api_id;
    try {
      const res = await fetch('https://v3.football.api-sports.io/leagues?id=' + apiId, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const json = await res.json();
      if (!json.response?.length) { skipped++; continue; }

      const ld = json.response[0];
      const apiSeasons = ld.seasons ?? [];
      const leagueName = ld.league.name;
      const leagueCountry = fixCountryCode(ld.country?.code);
      const leagueLogo = ld.league.logo ?? league.logo;
      const leagueType = ld.league.type === 'Cup' ? 'CUP' : 'LEAGUE';

      for (const s of apiSeasons) {
        const year = s.year;
        const dbSeason = String(year);

        const { rows: existing } = await pool.query(
          "SELECT id FROM leagues WHERE provider_ref->>'apiFootball' = $1 AND season = $2 LIMIT 1",
          [apiId, dbSeason]
        );
        if (existing.length > 0) { skipped++; continue; }

        const baseSlug = league.slug
          .replace(/-[0-9]{4}-[0-9]{4}$/, '')
          .replace(/-[0-9]{4}$/, '');
        const newSlug = baseSlug + '-' + year + '-' + (year+1);

        await pool.query(
          "INSERT INTO leagues (name, slug, country_code, season, type, coverage_level, provider_ref, is_active) VALUES ($1, $2, $3, $4, $5::league_type, 1, $6, true) ON CONFLICT (slug) DO NOTHING",
          [leagueName, newSlug, leagueCountry, dbSeason, leagueType, JSON.stringify({ apiFootball: apiId, logo: leagueLogo })]
        );
        added++;
      }

      if (i % 50 === 0) {
        const yrs = apiSeasons.map(s => s.year);
        console.log('[' + (i+1) + '/' + leagues.length + '] ' + leagueName + ' — ' + (yrs.length ? Math.min(...yrs) + '-' + Math.max(...yrs) : '?'));
      }
      await delay(350);
    } catch(e) {
      errors++;
      console.error('ERR ' + league.name + ': ' + e.message);
      await delay(350);
    }
  }

  console.log('Done! Added: ' + added + ' | Skipped: ' + skipped + ' | Errors: ' + errors);
  await pool.end();
}

main().catch(console.error);
