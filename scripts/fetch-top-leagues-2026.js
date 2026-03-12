const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';

const TOP_LEAGUES = [
  { extId: '39',  name: 'Premier League',        slug: 'premier-league',        country: 'GB' },
  { extId: '140', name: 'La Liga',               slug: 'la-liga',               country: 'ES' },
  { extId: '135', name: 'Serie A',               slug: 'serie-a',               country: 'IT' },
  { extId: '78',  name: 'Bundesliga',            slug: 'bundesliga',            country: 'DE' },
  { extId: '61',  name: 'Ligue 1',               slug: 'ligue-1',               country: 'FR' },
  { extId: '2',   name: 'UEFA Champions League', slug: 'uefa-champions-league', country: 'WW' },
  { extId: '3',   name: 'UEFA Europa League',    slug: 'europa-league',         country: 'WW' },
  { extId: '307', name: 'Saudi Pro League',      slug: 'saudi-pro-league',      country: 'SA' },
];

async function main() {
  for (const lg of TOP_LEAGUES) {
    const newSlug = `${lg.slug}-2025-2026`;
    const { rows: existing } = await pool.query(
      `SELECT id FROM leagues WHERE provider_ref->>'apiFootball'=$1 AND season='2026'`, [lg.extId]
    );

    let leagueId;
    if (existing[0]) {
      leagueId = existing[0].id;
      console.log(`${lg.name} 2026 already exists`);
    } else {
      const { rows: old } = await pool.query(
        `SELECT provider_ref FROM leagues WHERE provider_ref->>'apiFootball'=$1 AND season='2025'`, [lg.extId]
      );
      const providerRef = old[0]?.provider_ref ?? { apiFootball: lg.extId };
      const { rows: ins } = await pool.query(`
        INSERT INTO leagues (id, name, slug, country_code, season, type, coverage_level, provider_ref, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, '2026', 'LEAGUE', 1, $4::jsonb, true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET is_active=true, updated_at=NOW()
        RETURNING id
      `, [lg.name, newSlug, lg.country, JSON.stringify(providerRef)]);
      leagueId = ins[0].id;
      console.log(`✓ Created ${lg.name} 2025-2026`);
    }

    const res = await fetch(`https://v3.football.api-sports.io/standings?league=${lg.extId}&season=2025`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await res.json();
    const standings = data.response?.[0]?.league?.standings?.[0] ?? [];
    console.log(`  Standings: ${standings.length} teams`);

    for (const s of standings) {
      const { rows: team } = await pool.query(
        `SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`, [String(s.team.id)]
      );
      if (!team[0]) continue;

      const zone = s.description?.includes('Relega') ? 'RELEGATION' :
                   s.description?.includes('Promot') ? 'PROMOTION' :
                   s.description?.includes('Champion') ? 'PROMOTION' :
                   s.description?.includes('Europa') ? 'PROMOTION' : 'NONE';

      await pool.query(`
        INSERT INTO standings (id, league_id, team_id, season, position, played, wins, draws, losses, goals_for, goals_against, points, form, zone, updated_at)
        VALUES (gen_random_uuid(), $1, $2, '2026', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT (league_id, team_id, season) DO UPDATE SET
          position=$3, played=$4, wins=$5, draws=$6, losses=$7,
          goals_for=$8, goals_against=$9, points=$10, form=$11, zone=$12, updated_at=NOW()
      `, [
        leagueId, team[0].id,
        s.rank, s.all.played, s.all.win, s.all.draw, s.all.lose,
        s.all.goals.for, s.all.goals.against, s.points,
        s.form ?? null, zone
      ]);
    }
    console.log(`✓ ${lg.name} standings saved`);
    await new Promise(r => setTimeout(r, 500));
  }

  await pool.end();
  console.log('\nDone!');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
