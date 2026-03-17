import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:WatchKick2026@127.0.0.1:5432/watchkickoff' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';

const EXT_IDS = ['1428505', '1494574', '1529480', '1526634', '1529483'];
const STATUS_MAP = {'FT':'FINISHED','AET':'FINISHED','PEN':'FINISHED','NS':'SCHEDULED','1H':'LIVE_1H','2H':'LIVE_2H','HT':'HALF_TIME','ET':'EXTRA_TIME','P':'PENALTIES','PST':'POSTPONED','CANC':'CANCELLED'};

async function q(sql, params=[]) { const c = await pool.connect(); try { return await c.query(sql, params); } finally { c.release(); } }

for (const id of EXT_IDS) {
  const res = await fetch(`https://v3.football.api-sports.io/fixtures?id=${id}`, { headers: {'x-apisports-key': API_KEY} });
  const data = await res.json();
  const fx = data.response?.[0];
  if (!fx) { console.log(`❌ ${id}: not found`); continue; }
  const status = STATUS_MAP[fx.fixture.status.short] || 'FINISHED';
  await q(`UPDATE matches SET status=$1::match_status, home_score=$2, away_score=$3, minute=null, updated_at=NOW() WHERE provider_ref->>'apiFootball'=$4`,
    [status, fx.goals.home??0, fx.goals.away??0, id]);
  console.log(`✅ ${id}: ${fx.teams.home.name} ${fx.goals.home}-${fx.goals.away} ${fx.teams.away.name} → ${status}`);
  await new Promise(r => setTimeout(r, 400));
}

await pool.end();
