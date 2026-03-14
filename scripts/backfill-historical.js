const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', user:'postgres', password:'WatchKick2026', database:'watchkickoff' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const delay = ms => new Promise(r => setTimeout(r, ms));

// الدوريات الـ 8 الكبيرة مع API IDs
const BIG_LEAGUES = [
  { name: 'Premier League',        apiId: 39  },
  { name: 'La Liga',               apiId: 140 },
  { name: 'Serie A',               apiId: 135 },
  { name: 'Bundesliga',            apiId: 78  },
  { name: 'Ligue 1',               apiId: 61  },
  { name: 'Champions League',      apiId: 2   },
  { name: 'Europa League',         apiId: 3   },
  { name: 'Saudi Pro League',      apiId: 307 },
];

const FROM_YEAR = 2015;
const TO_YEAR   = 2024; // 2025 موجود بالفعل

async function fetchFixtures(apiId, season) {
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=${apiId}&season=${season}`,
    { headers: { 'x-apisports-key': API_KEY } }
  );
  const json = await res.json();
  return json.response ?? [];
}

async function fetchStandings(apiId, season) {
  const res = await fetch(
    `https://v3.football.api-sports.io/standings?league=${apiId}&season=${season}`,
    { headers: { 'x-apisports-key': API_KEY } }
  );
  const json = await res.json();
  return json.response?.[0]?.league?.standings?.[0] ?? [];
}

async function fetchEvents(fixtureId) {
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`,
    { headers: { 'x-apisports-key': API_KEY } }
  );
  const json = await res.json();
  return json.response ?? [];
}

async function upsertTeam(pool, t) {
  const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
    + '-' + t.id;
  await pool.query(`
    INSERT INTO teams (name, slug, crest_url, country_code, provider_ref)
    VALUES ($1, $2, $3, 'WW', $4)
    ON CONFLICT (slug) DO UPDATE SET crest_url = EXCLUDED.crest_url
  `, [t.name, slug, t.logo, JSON.stringify({ apiFootball: String(t.id) })]);

  const { rows } = await pool.query(
    `SELECT id FROM teams WHERE slug = $1`, [slug]
  );
  return rows[0]?.id;
}

async function processLeagueSeason(apiId, season, leagueName) {
  console.log(`  → Fetching fixtures for ${leagueName} ${season}/${season+1}...`);

  // جيب الـ league من DB
  const { rows: lgRows } = await pool.query(
    `SELECT id FROM leagues WHERE provider_ref->>'apiFootball' = $1 AND season = $2 LIMIT 1`,
    [String(apiId), String(season)]
  );
  if (!lgRows.length) { console.log(`    ⚠ League not in DB`); return 0; }
  const leagueId = lgRows[0].id;

  const fixtures = await fetchFixtures(apiId, season);
  console.log(`    Found ${fixtures.length} fixtures`);

  let matchesAdded = 0;

  for (const f of fixtures) {
    const fix = f.fixture;
    const home = f.teams.home;
    const away = f.teams.away;
    const goals = f.goals;

    // upsert teams
    const homeId = await upsertTeam(pool, home);
    const awayId = await upsertTeam(pool, away);
    if (!homeId || !awayId) continue;

    // map status
    const statusMap = {
      'FT':'FINISHED','AET':'FINISHED','PEN':'FINISHED',
      'NS':'SCHEDULED','TBD':'SCHEDULED',
      '1H':'LIVE_1H','HT':'HALF_TIME','2H':'LIVE_2H',
      'ET':'EXTRA_TIME','P':'PENALTIES',
      'PST':'POSTPONED','CANC':'CANCELLED','SUSP':'SUSPENDED',
      'AWD':'AWARDED',
    };
    const status = statusMap[fix.status?.short] ?? 'SCHEDULED';

    const kickoff = fix.date ? new Date(fix.date).toISOString() : null;
    if (!kickoff) continue;

    const slug = `${home.name}-vs-${away.name}-${fix.date?.slice(0,10)}`
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
      + '-' + fix.id;

    // upsert match
    const { rows: mRows } = await pool.query(`
      INSERT INTO matches (
        slug, league_id, home_team_id, away_team_id,
        kickoff_at, status, home_score, away_score, season, provider_ref
      ) VALUES ($1,$2,$3,$4,$5,$6::match_status,$7,$8,$9,$10)
      ON CONFLICT (slug) DO UPDATE SET
        status = EXCLUDED.status,
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score
      RETURNING id
    `, [
      slug, leagueId, homeId, awayId,
      kickoff, status,
      goals.home ?? 0, goals.away ?? 0,
      String(season),
      JSON.stringify({ apiFootball: String(fix.id) })
    ]);

    matchesAdded++;
    await delay(50);
  }

  console.log(`    ✅ ${matchesAdded} matches upserted`);
  return matchesAdded;
}

async function main() {
  let totalMatches = 0;
  let requestCount = 0;

  for (const league of BIG_LEAGUES) {
    console.log(`\n🏆 ${league.name}`);

    for (let season = FROM_YEAR; season <= TO_YEAR; season++) {
      try {
        const count = await processLeagueSeason(league.apiId, season, league.name);
        totalMatches += count;
        requestCount++;

        // log quota usage
        if (requestCount % 10 === 0) {
          console.log(`\n📊 Requests used so far: ~${requestCount * 2} | Matches: ${totalMatches}\n`);
        }

        await delay(400);
      } catch(e) {
        console.error(`  ❌ ${league.name} ${season}: ${e.message}`);
        await delay(400);
      }
    }
  }

  console.log(`\n✅ DONE! Total matches: ${totalMatches} | API requests: ~${requestCount * 2}`);
  await pool.end();
}

main().catch(console.error);
