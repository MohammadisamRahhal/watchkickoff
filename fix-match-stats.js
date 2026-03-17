import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:WatchKick2026@127.0.0.1:5432/watchkickoff' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';

async function q(sql, params=[]) { const c = await pool.connect(); try { return await c.query(sql, params); } finally { c.release(); } }

const {rows:[match]} = await q(`SELECT id, provider_ref->>'apiFootball' as ext_id FROM matches WHERE slug='brentford-vs-wolves-2026-03-16'`);
if (!match) { console.log('❌ Match not found'); process.exit(1); }

const res = await fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${match.ext_id}`, { headers: {'x-apisports-key': API_KEY} });
const data = await res.json();

const {rows:[matchRow]} = await q(`
  SELECT ht.provider_ref->>'apiFootball' as home_ext, at.provider_ref->>'apiFootball' as away_ext
  FROM matches m JOIN teams ht ON ht.id=m.home_team_id JOIN teams at ON at.id=m.away_team_id WHERE m.id=$1`,[match.id]);

const homeStats = data.response?.find(t => String(t.team.id) === matchRow?.home_ext);
const awayStats = data.response?.find(t => String(t.team.id) === matchRow?.away_ext);

if (!homeStats || !awayStats) { console.log('❌ No stats from API'); process.exit(1); }

const allTypes = new Set([...(homeStats.statistics||[]).map(s=>s.type), ...(awayStats.statistics||[]).map(s=>s.type)]);
let i=0;
for (const type of allTypes) {
  const hv = homeStats.statistics?.find(s=>s.type===type)?.value??null;
  const av = awayStats.statistics?.find(s=>s.type===type)?.value??null;
  await q(`INSERT INTO match_statistics (match_id,type,home_value,away_value,sort_order,created_at) VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT DO NOTHING`,
    [match.id, type, String(hv??0), String(av??0), i++]);
}
console.log(`✅ Done! ${i} stats inserted`);
await pool.end();
