import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

const API_KEY  = 'd8a653353374e0d1b32c7afb3adf30b2';
const API_BASE = 'https://v3.football.api-sports.io';
const SEASON   = '2025';
const DELAY    = 350;
const PROGRESS = '/tmp/sync-stats-progress.json';
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

async function syncStats(league) {
  const { rows: matches } = await q(`
    SELECT m.id, m.provider_ref->>'apiFootball' AS ext_id
    FROM matches m JOIN leagues l ON l.id = m.league_id
    WHERE l.provider_ref->>'apiFootball' = $1 AND l.season = $2
      AND m.status = 'FINISHED'
      AND m.provider_ref->>'apiFootball' IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM match_statistics ms WHERE ms.match_id = m.id)
    ORDER BY m.kickoff_at DESC
  `, [String(league.id), SEASON]);

  if (!matches.length) { console.log(`  ✅ ${league.name}: stats complete`); return; }
  console.log(`  🔄 ${league.name}: ${matches.length} matches need stats`);

  let done = 0;
  for (const match of matches) {
    const key = `stats:${match.ext_id}`;
    if (progress.done[key]) { done++; continue; }
    try {
      const data = await apiGet(`/fixtures/statistics?fixture=${match.ext_id}`);
      const teams = data.response || [];

      // Get home and away team ext_ids for this match
      const { rows: [matchRow] } = await q(`
        SELECT 
          ht.provider_ref->>'apiFootball' as home_ext,
          at.provider_ref->>'apiFootball' as away_ext
        FROM matches m
        JOIN teams ht ON ht.id = m.home_team_id
        JOIN teams at ON at.id = m.away_team_id
        WHERE m.id = $1
      `, [match.id]);

      // Build home/away stat maps
      const homeStats = teams.find(t => String(t.team.id) === matchRow?.home_ext);
      const awayStats = teams.find(t => String(t.team.id) === matchRow?.away_ext);

      if (!homeStats || !awayStats) {
        progress.done[key] = true;
        done++;
        continue;
      }

      // Get all stat types from both teams
      const allTypes = new Set([
        ...(homeStats.statistics || []).map(s => s.type),
        ...(awayStats.statistics || []).map(s => s.type),
      ]);

      let sortOrder = 0;
      for (const type of allTypes) {
        const homeVal = homeStats.statistics?.find(s => s.type === type)?.value ?? null;
        const awayVal = awayStats.statistics?.find(s => s.type === type)?.value ?? null;
        
        await q(`
          INSERT INTO match_statistics (match_id, type, home_value, away_value, sort_order, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT DO NOTHING
        `, [match.id, type, String(homeVal ?? '0'), String(awayVal ?? '0'), sortOrder++]);
      }

      done++;
      progress.done[key] = true;
      if (done % 30 === 0) { process.stdout.write(`\r    ${done}/${matches.length}`); saveProgress(progress); }
    } catch (err) {
      console.error(`\n    ❌ stats ${match.ext_id}: ${err.message}`);
    }
  }
  console.log(`\n  ✅ ${league.name}: stats done (${done})`);
}

async function main() {
  console.log('🚀 Sync Match Statistics');
  console.log(`📊 Progress: ${Object.keys(progress.done).length} done | API: ${progress.apiCalls}\n`);

  for (const league of LEAGUES) {
    console.log(`\n🏆 ${league.name}`);
    await syncStats(league);
  }

  const { rows: [r] } = await q(`SELECT COUNT(*) as total FROM match_statistics`);
  console.log(`\n🎉 DONE! Total stats records: ${r.total} | API calls: ${progress.apiCalls}`);
  await pool.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
