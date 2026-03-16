import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

const API_KEY  = 'd8a653353374e0d1b32c7afb3adf30b2';
const API_BASE = 'https://v3.football.api-sports.io';
const SEASON   = '2025';
const DELAY    = 350;
const PROGRESS = '/tmp/sync-fixtures-progress.json';
const pool = new Pool({ connectionString: 'postgresql://postgres:WatchKick2026@127.0.0.1:5432/watchkickoff' });

const LEAGUES = [
  { id: 39,  name: 'Premier League'        },
  { id: 140, name: 'La Liga'               },
  { id: 135, name: 'Serie A'               },
  { id: 78,  name: 'Bundesliga'            },
  { id: 61,  name: 'Ligue 1'              },
  { id: 2,   name: 'UEFA Champions League' },
  { id: 3,   name: 'UEFA Europa League'    },
  { id: 307, name: 'Saudi Pro League'      },
];

function loadProgress() {
  if (fs.existsSync(PROGRESS)) return JSON.parse(fs.readFileSync(PROGRESS, 'utf8'));
  return { done: {}, apiCalls: 0 };
}
function saveProgress(p) { fs.writeFileSync(PROGRESS, JSON.stringify(p, null, 2)); }
const progress = loadProgress();

async function apiGet(endpoint) {
  await new Promise(r => setTimeout(r, DELAY));
  const res = await fetch(`${API_BASE}${endpoint}`, { headers: { 'x-apisports-key': API_KEY } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  progress.apiCalls++;
  if (progress.apiCalls % 50 === 0) { console.log(`  📊 API calls: ${progress.apiCalls}`); saveProgress(progress); }
  return data;
}

async function q(sql, params = []) {
  const c = await pool.connect();
  try { return await c.query(sql, params); } finally { c.release(); }
}

function slugify(s) { return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'unknown'; }

const STATUS_MAP = {
  'FT':'FINISHED','AET':'FINISHED','PEN':'FINISHED',
  'NS':'SCHEDULED','TBD':'SCHEDULED',
  '1H':'LIVE_1H','2H':'LIVE_2H','HT':'HALF_TIME',
  'ET':'EXTRA_TIME','P':'PENALTIES',
  'PST':'POSTPONED','CANC':'CANCELLED','SUSP':'SUSPENDED',
  'AWD':'AWARDED','WO':'AWARDED',
};

async function syncLeagueFixtures(league) {
  const key = `fixtures:${league.id}`;
  if (progress.done[key]) { console.log(`  ⏭️  ${league.name}: fixtures already synced`); return; }

  console.log(`\n  🔄 ${league.name}: fetching all fixtures from API...`);
  const data = await apiGet(`/fixtures?league=${league.id}&season=${SEASON}`);
  const fixtures = data.response || [];
  console.log(`  📋 ${league.name}: ${fixtures.length} fixtures from API`);

  const {rows:[lg]} = await q(`SELECT id FROM leagues WHERE provider_ref->>'apiFootball'=$1 AND season=$2 LIMIT 1`,[String(league.id),SEASON]);
  if (!lg) { console.log(`  ❌ League not found in DB`); return; }

  let added=0, updated=0, skipped=0;

  for (const fx of fixtures) {
    try {
      const f = fx.fixture;
      const teams = fx.teams;
      const goals = fx.goals;
      const extId = String(f.id);
      const status = STATUS_MAP[f.status.short] || 'SCHEDULED';

      // Get or create home team
      let {rows:[homeTeam]} = await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(teams.home.id)]);
      if (!homeTeam) {
        const slug = slugify(teams.home.name);
        await q(`INSERT INTO teams (id,name,slug,country_code,crest_url,provider_ref,created_at,updated_at)
          VALUES (gen_random_uuid(),$1,$2,'WW',$3,jsonb_build_object('apiFootball',$4::text),NOW(),NOW())
          ON CONFLICT (slug) DO UPDATE SET provider_ref=jsonb_build_object('apiFootball',$4::text),updated_at=NOW()`,
          [teams.home.name,slug,teams.home.logo||null,String(teams.home.id)]);
        const r = await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(teams.home.id)]);
        homeTeam = r.rows[0];
      }

      // Get or create away team
      let {rows:[awayTeam]} = await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(teams.away.id)]);
      if (!awayTeam) {
        const slug = slugify(teams.away.name);
        await q(`INSERT INTO teams (id,name,slug,country_code,crest_url,provider_ref,created_at,updated_at)
          VALUES (gen_random_uuid(),$1,$2,'WW',$3,jsonb_build_object('apiFootball',$4::text),NOW(),NOW())
          ON CONFLICT (slug) DO UPDATE SET provider_ref=jsonb_build_object('apiFootball',$4::text),updated_at=NOW()`,
          [teams.away.name,slug,teams.away.logo||null,String(teams.away.id)]);
        const r = await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(teams.away.id)]);
        awayTeam = r.rows[0];
      }

      if (!homeTeam || !awayTeam) { skipped++; continue; }

      // League seasons
      await q(`INSERT INTO league_seasons (league_id,team_id,season) VALUES ($1,$2,$3),($1,$4,$3) ON CONFLICT DO NOTHING`,
        [lg.id,homeTeam.id,SEASON,awayTeam.id]);

      // Check if match exists by provider_ref
      const {rows:[existing]} = await q(`SELECT id,status FROM matches WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[extId]);

      const kickoffAt = new Date(f.date);
      const matchSlug = `${slugify(teams.home.name)}-vs-${slugify(teams.away.name)}-${kickoffAt.toISOString().slice(0,10)}`;

      if (existing) {
        // Update status and score
        await q(`UPDATE matches SET status=$1::match_status,home_score=$2,away_score=$3,
          home_score_ht=$4,away_score_ht=$5,raw_status=$6,updated_at=NOW() WHERE id=$7`,
          [status,goals.home??0,goals.away??0,
           fx.score?.halftime?.home??null,fx.score?.halftime?.away??null,
           f.status.short,existing.id]);
        updated++;
      } else {
        // Insert new match — handle slug conflict
        try {
          await q(`INSERT INTO matches (id,slug,league_id,home_team_id,away_team_id,kickoff_at,status,home_score,away_score,home_score_ht,away_score_ht,season,round,venue,raw_status,provider_ref,created_at,updated_at)
            VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6::match_status,$7,$8,$9,$10,$11,$12,$13,$14,jsonb_build_object('apiFootball',$15::text),NOW(),NOW())`,
            [matchSlug,lg.id,homeTeam.id,awayTeam.id,kickoffAt,status,
             goals.home??0,goals.away??0,
             fx.score?.halftime?.home??null,fx.score?.halftime?.away??null,
             SEASON,f.round||null,f.fixture?.venue?.name||null,f.status.short,extId]);
          added++;
        } catch(e) {
          if (e.code==='23505') {
            // Slug conflict — update provider_ref on existing
            await q(`UPDATE matches SET provider_ref=jsonb_build_object('apiFootball',$1::text),
              status=$2::match_status,home_score=$3,away_score=$4,updated_at=NOW()
              WHERE slug=$5`,
              [extId,status,goals.home??0,goals.away??0,matchSlug]);
            updated++;
          }
        }
      }
    } catch(err) {
      console.error(`  ❌ fixture ${fx.fixture?.id}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`  ✅ ${league.name}: +${added} added, ${updated} updated, ${skipped} skipped`);
  progress.done[key]=true; saveProgress(progress);
}

async function printReport() {
  console.log('\n📊 FINAL REPORT:');
  for (const league of LEAGUES) {
    const {rows:[lg]} = await q(`SELECT id,name FROM leagues WHERE provider_ref->>'apiFootball'=$1 AND season=$2 LIMIT 1`,[String(league.id),SEASON]);
    if (!lg) continue;
    const {rows:[r]} = await q(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status='FINISHED' THEN 1 END) as finished,
        COUNT(CASE WHEN status='FINISHED' AND NOT EXISTS (SELECT 1 FROM match_events me WHERE me.match_id=m.id) THEN 1 END) as missing_events,
        COUNT(CASE WHEN status='FINISHED' AND NOT EXISTS (SELECT 1 FROM match_lineups ml WHERE ml.match_id=m.id) THEN 1 END) as missing_lineups,
        COUNT(CASE WHEN status='FINISHED' AND NOT EXISTS (SELECT 1 FROM match_statistics ms WHERE ms.match_id=m.id) THEN 1 END) as missing_stats
      FROM matches m WHERE league_id=$1`,[lg.id]);
    console.log(`  ${lg.name}: ${r.total} matches | ${r.finished} finished | ❌events:${r.missing_events} lineups:${r.missing_lineups} stats:${r.missing_stats}`);
  }
}

async function main() {
  console.log('🚀 Fixtures Sync 2025 — Fill Missing Matches');
  console.log(`📊 Progress: ${Object.keys(progress.done).length} done | API calls: ${progress.apiCalls}\n`);

  for (const league of LEAGUES) {
    console.log(`\n${'='.repeat(55)}\n🏆 ${league.name}\n${'='.repeat(55)}`);
    await syncLeagueFixtures(league);
  }

  await printReport();
  console.log(`\n🎉 DONE! Total API calls: ${progress.apiCalls}`);
  await pool.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
