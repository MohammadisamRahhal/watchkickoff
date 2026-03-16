import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

const API_KEY  = 'd8a653353374e0d1b32c7afb3adf30b2';
const API_BASE = 'https://v3.football.api-sports.io';
const SEASON   = '2025';
const DELAY    = 350;
const PROGRESS = '/tmp/sync-2025-progress.json';
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

function slugify(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

// ── PHASE 1: Standings ────────────────────────────────────────────────────────
async function syncStandings(league) {
  const key = `standings:${league.id}`;
  if (progress.done[key]) { process.stdout.write('.'); return; }
  const data = await apiGet(`/standings?league=${league.id}&season=${SEASON}`);
  const groups = data.response?.[0]?.league?.standings;
  if (!groups) { progress.done[key] = true; saveProgress(progress); return; }
  const { rows: [lg] } = await q(`SELECT id FROM leagues WHERE provider_ref->>'apiFootball'=$1 AND season=$2 LIMIT 1`, [String(league.id), SEASON]);
  if (!lg) return;
  let count = 0;
  for (const entry of groups.flat()) {
    const { rows: [team] } = await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`, [String(entry.team.id)]);
    if (!team) continue;
    await q(`INSERT INTO league_seasons (league_id,team_id,season) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [lg.id, team.id, SEASON]);
    const desc = (entry.description || '').toLowerCase();
    const zone = desc.includes('relegat') ? 'RELEGATION' : (desc.includes('promot') || desc.includes('champions league') || desc.includes('qualify')) ? 'PROMOTION' : desc.includes('playoff') ? 'CHAMPIONSHIP' : 'NONE';
    await q(`
      INSERT INTO standings (id,league_id,team_id,season,position,played,wins,draws,losses,goals_for,goals_against,points,form,zone,updated_at)
      VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::standing_zone,NOW())
      ON CONFLICT (league_id,team_id,season) DO UPDATE SET
        position=$4,played=$5,wins=$6,draws=$7,losses=$8,goals_for=$9,goals_against=$10,points=$11,form=$12,zone=$13::standing_zone,updated_at=NOW()
    `, [lg.id, team.id, SEASON, entry.rank, entry.all.played, entry.all.win, entry.all.draw, entry.all.lose, entry.all.goals.for, entry.all.goals.against, entry.points, entry.form||null, zone]);
    count++;
  }
  console.log(`\n  ✅ ${league.name} standings: ${count}`);
  progress.done[key] = true; saveProgress(progress);
}

// ── PHASE 2: Top Scorers ──────────────────────────────────────────────────────
async function syncScorers(league) {
  const key = `scorers:${league.id}`;
  if (progress.done[key]) { process.stdout.write('.'); return; }
  const data = await apiGet(`/players/topscorers?league=${league.id}&season=${SEASON}`);
  const { rows: [lg] } = await q(`SELECT id FROM leagues WHERE provider_ref->>'apiFootball'=$1 AND season=$2 LIMIT 1`, [String(league.id), SEASON]);
  if (!lg) { progress.done[key] = true; saveProgress(progress); return; }
  let count = 0;
  for (const item of (data.response || [])) {
    try {
      const p = item.player; const stats = item.statistics?.[0];
      if (!stats) continue;
      const slug = `player-${p.id}-${slugify(p.name).slice(0,50)}`;
      await q(`INSERT INTO players (id,name,slug,nationality_code,date_of_birth,height_cm,provider_ref,status,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,jsonb_build_object('apiFootball',$6::text),'ACTIVE',NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,updated_at=NOW()`,
        [p.name, slug, p.nationality?.slice(0,2).toUpperCase()||null, p.birth?.date||null, p.height?parseInt(p.height):null, String(p.id)]);
      const { rows: [player] } = await q(`SELECT id FROM players WHERE slug=$1 LIMIT 1`, [slug]);
      if (!player) continue;
      const { rows: [team] } = await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`, [String(stats.team.id)]);
      if (!team) continue;
      await q(`UPDATE players SET current_team_id=$1,updated_at=NOW() WHERE id=$2`, [team.id, player.id]);
      await q(`
        INSERT INTO season_stats (id,player_id,team_id,league_id,season,goals,assists,appearances,minutes_played,yellow_cards,red_cards,shots_total,shots_on_target,passes_total,pass_accuracy,rating,updated_at)
        VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
        ON CONFLICT (player_id,league_id,season) DO UPDATE SET goals=$5,assists=$6,appearances=$7,minutes_played=$8,yellow_cards=$9,red_cards=$10,shots_total=$11,shots_on_target=$12,passes_total=$13,pass_accuracy=$14,rating=$15,updated_at=NOW()
      `, [player.id,team.id,lg.id,SEASON, stats.goals?.total||0,stats.goals?.assists||0,stats.games?.appearences||0,stats.games?.minutes||0,stats.cards?.yellow||0,stats.cards?.red||0,stats.shots?.total||0,stats.shots?.on||0,stats.passes?.total||0,stats.passes?.accuracy||null,stats.games?.rating?parseFloat(stats.games.rating):null]);
      count++;
    } catch {}
  }
  console.log(`\n  ✅ ${league.name} scorers: ${count}`);
  progress.done[key] = true; saveProgress(progress);
}

// ── PHASE 3: Squads + Team Info + Coach ───────────────────────────────────────
async function syncSquads(league) {
  const { rows: teams } = await q(`
    SELECT DISTINCT t.id, t.provider_ref->>'apiFootball' AS ext_id, t.name
    FROM teams t JOIN matches m ON (m.home_team_id=t.id OR m.away_team_id=t.id)
    JOIN leagues l ON l.id=m.league_id
    WHERE l.provider_ref->>'apiFootball'=$1 AND l.season=$2 AND t.provider_ref->>'apiFootball' IS NOT NULL
  `, [String(league.id), SEASON]);
  const { rows: [lg] } = await q(`SELECT id FROM leagues WHERE provider_ref->>'apiFootball'=$1 AND season=$2 LIMIT 1`, [String(league.id), SEASON]);
  console.log(`\n  🔄 ${league.name}: ${teams.length} teams`);
  for (const team of teams) {
    if (lg) await q(`INSERT INTO league_seasons (league_id,team_id,season) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [lg.id, team.id, SEASON]);
    // Squad
    const sqKey = `squad:${team.ext_id}`;
    if (!progress.done[sqKey]) {
      try {
        const data = await apiGet(`/players/squads?team=${team.ext_id}`);
        for (const sq of (data.response||[])) {
          for (const p of (sq.players||[])) {
            try {
              const slug = `player-${p.id}-${slugify(p.name).slice(0,50)}`;
              const pos = p.position==='Goalkeeper'?'GK':p.position==='Defender'?'DEF':p.position==='Midfielder'?'MID':p.position==='Attacker'?'FWD':null;
              await q(`INSERT INTO players (id,name,slug,nationality_code,date_of_birth,height_cm,position,current_team_id,provider_ref,status,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6::player_position,$7,jsonb_build_object('apiFootball',$8::text),'ACTIVE',NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,position=COALESCE($6::player_position,players.position),current_team_id=$7,updated_at=NOW()`,
                [p.name,slug,p.nationality?.slice(0,2).toUpperCase()||null,p.birth?.date||null,p.height?parseInt(p.height):null,pos,team.id,String(p.id)]);
            } catch {}
          }
        }
        progress.done[sqKey] = true; saveProgress(progress);
      } catch (err) { console.error(`\n    ❌ squad ${team.name}: ${err.message}`); }
    }
    // Team info
    const tiKey = `teaminfo:${team.ext_id}`;
    if (!progress.done[tiKey]) {
      try {
        const data = await apiGet(`/teams?id=${team.ext_id}`);
        const info = data.response?.[0];
        if (info) {
          await q(`UPDATE teams SET stadium_name=COALESCE($1,stadium_name),founded_year=COALESCE($2,founded_year),crest_url=COALESCE(NULLIF($3,''),crest_url),updated_at=NOW() WHERE id=$4`,
            [info.venue?.name||null, info.team?.founded||null, info.team?.logo||null, team.id]);
        }
        progress.done[tiKey] = true; saveProgress(progress);
      } catch (err) { console.error(`\n    ❌ teaminfo ${team.name}: ${err.message}`); }
    }
    // Coach
    const coKey = `coach:${team.ext_id}`;
    if (!progress.done[coKey]) {
      try {
        const data = await apiGet(`/coachs?team=${team.ext_id}`);
        const coaches = data.response||[];
        const current = coaches.find(c => c.career?.some(car => car.team?.id===parseInt(team.ext_id) && !car.end)) || coaches[0];
        if (current) await q(`UPDATE teams SET coach_name=$1,coach_photo=$2,updated_at=NOW() WHERE id=$3`, [current.name||null, current.photo||null, team.id]);
        progress.done[coKey] = true; saveProgress(progress);
      } catch (err) { console.error(`\n    ❌ coach ${team.name}: ${err.message}`); }
    }
  }
  console.log(`\n  ✅ ${league.name}: teams done`);
}

// ── PHASE 4: Transfers ────────────────────────────────────────────────────────
async function syncTransfers(league) {
  const { rows: teams } = await q(`
    SELECT DISTINCT t.id, t.provider_ref->>'apiFootball' AS ext_id
    FROM teams t JOIN matches m ON (m.home_team_id=t.id OR m.away_team_id=t.id)
    JOIN leagues l ON l.id=m.league_id
    WHERE l.provider_ref->>'apiFootball'=$1 AND l.season=$2 AND t.provider_ref->>'apiFootball' IS NOT NULL
  `, [String(league.id), SEASON]);
  let count = 0;
  for (const team of teams) {
    const key = `transfers:${team.ext_id}`;
    if (progress.done[key]) continue;
    try {
      const data = await apiGet(`/transfers?team=${team.ext_id}`);
      for (const item of (data.response||[])) {
        try {
          const { rows: [player] } = await q(`SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`, [String(item.player.id)]);
          if (!player) continue;
          for (const tr of (item.transfers||[])) {
            try {
              const fromRes = tr.teams?.out?.id ? await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(tr.teams.out.id)]) : {rows:[]};
              const toRes = tr.teams?.in?.id ? await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(tr.teams.in.id)]) : {rows:[]};
              const feeType = tr.type==='Free'?'FREE':tr.type==='Loan'?'LOAN':'PAID';
              await q(`INSERT INTO transfers (id,player_id,from_team_id,to_team_id,transfer_date,fee_type,created_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5::transfer_type,NOW()) ON CONFLICT DO NOTHING`,
                [player.id, fromRes.rows[0]?.id||null, toRes.rows[0]?.id||null, tr.date||'2025-01-01', feeType]);
              count++;
            } catch {}
          }
        } catch {}
      }
      progress.done[key] = true; saveProgress(progress);
    } catch (err) { console.error(`\n    ❌ transfers ${team.ext_id}: ${err.message}`); }
  }
  console.log(`\n  ✅ ${league.name}: ${count} transfers`);
}

// ── PHASE 5: Match Events ─────────────────────────────────────────────────────
async function syncMissingEvents(league) {
  const { rows: matches } = await q(`
    SELECT m.id, m.provider_ref->>'apiFootball' AS ext_id
    FROM matches m JOIN leagues l ON l.id=m.league_id
    WHERE l.provider_ref->>'apiFootball'=$1 AND l.season=$2 AND m.status='FINISHED'
      AND m.provider_ref->>'apiFootball' IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM match_events me WHERE me.match_id=m.id)
    ORDER BY m.kickoff_at DESC
  `, [String(league.id), SEASON]);
  if (!matches.length) { console.log(`\n  ✅ ${league.name}: events complete`); return; }
  console.log(`\n  🔄 ${league.name}: ${matches.length} matches need events`);
  let done = 0;
  for (const match of matches) {
    const key = `events:${match.ext_id}`;
    if (progress.done[key]) { done++; continue; }
    try {
      const data = await apiGet(`/fixtures/events?fixture=${match.ext_id}`);
      for (const ev of (data.response||[])) {
        try {
          const { rows: [team] } = await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(ev.team.id)]);
          if (!team) continue;
          let playerId = null;
          if (ev.player?.id) { const r = await q(`SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(ev.player.id)]); playerId = r.rows[0]?.id||null; }
          let assistId = null;
          if (ev.assist?.id) { const r = await q(`SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(ev.assist.id)]); assistId = r.rows[0]?.id||null; }
          const eventType = ev.type==='Goal'?(ev.detail==='Own Goal'?'OWN_GOAL':ev.detail==='Penalty'?'PENALTY_SCORED':'GOAL'):ev.type==='Card'?(ev.detail==='Yellow Card'?'YELLOW':ev.detail==='Second Yellow Card'?'SECOND_YELLOW':ev.detail==='Red Card'?'RED':null):ev.type==='subst'?'SUB_IN':ev.type==='Var'?'VAR':null;
          if (!eventType) continue;
          await q(`INSERT INTO match_events (id,match_id,team_id,player_id,assist_player_id,event_type,minute,minute_extra,detail,created_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5::event_type,$6,$7,$8,NOW()) ON CONFLICT DO NOTHING`,
            [match.id,team.id,playerId,assistId,eventType,ev.time?.elapsed||0,ev.time?.extra||0,(ev.detail||'').slice(0,100)]);
        } catch {}
      }
      done++; progress.done[key] = true;
      if (done % 30 === 0) { process.stdout.write(`\r    ${done}/${matches.length}`); saveProgress(progress); }
    } catch (err) { console.error(`\n    ❌ events ${match.ext_id}: ${err.message}`); }
  }
  console.log(`\n  ✅ ${league.name}: events done (${done})`);
}

// ── PHASE 6: Match Lineups ────────────────────────────────────────────────────
async function syncMissingLineups(league) {
  const { rows: matches } = await q(`
    SELECT m.id, m.provider_ref->>'apiFootball' AS ext_id
    FROM matches m JOIN leagues l ON l.id=m.league_id
    WHERE l.provider_ref->>'apiFootball'=$1 AND l.season=$2 AND m.status='FINISHED'
      AND m.provider_ref->>'apiFootball' IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM match_lineups ml WHERE ml.match_id=m.id)
    ORDER BY m.kickoff_at DESC
  `, [String(league.id), SEASON]);
  if (!matches.length) { console.log(`\n  ✅ ${league.name}: lineups complete`); return; }
  console.log(`\n  🔄 ${league.name}: ${matches.length} matches need lineups`);
  let done = 0;
  for (const match of matches) {
    const key = `lineups:${match.ext_id}`;
    if (progress.done[key]) { done++; continue; }
    try {
      const data = await apiGet(`/fixtures/lineups?fixture=${match.ext_id}`);
      for (const tl of (data.response||[])) {
        const { rows: [team] } = await q(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(tl.team.id)]);
        if (!team) continue;
        const allPlayers = [...(tl.startXI||[]).map((p,i)=>({...p.player,isStarter:true,slot:i+1})), ...(tl.substitutes||[]).map((p,i)=>({...p.player,isStarter:false,slot:i+12}))];
        for (const p of allPlayers) {
          if (!p.id) continue;
          try {
            let { rows: [player] } = await q(`SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1 LIMIT 1`,[String(p.id)]);
            if (!player) {
              const slug = `player-${p.id}-${slugify(p.name||'unknown').slice(0,50)}`;
              await q(`INSERT INTO players (id,name,slug,current_team_id,provider_ref,status,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,jsonb_build_object('apiFootball',$4::text),'ACTIVE',NOW(),NOW()) ON CONFLICT (slug) DO NOTHING`,
                [p.name||'Unknown',slug,team.id,String(p.id)]);
              const r = await q(`SELECT id FROM players WHERE slug=$1 LIMIT 1`,[slug]);
              player = r.rows[0];
            }
            if (!player) continue;
            await q(`INSERT INTO match_lineups (id,match_id,team_id,player_id,shirt_number,position_code,formation_slot,is_starter,is_captain) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,false) ON CONFLICT (match_id,team_id,player_id) DO UPDATE SET shirt_number=EXCLUDED.shirt_number,position_code=EXCLUDED.position_code,is_starter=EXCLUDED.is_starter`,
              [match.id,team.id,player.id,p.number||null,p.pos||null,p.slot,p.isStarter]);
          } catch {}
        }
      }
      done++; progress.done[key] = true;
      if (done % 30 === 0) { process.stdout.write(`\r    ${done}/${matches.length}`); saveProgress(progress); }
    } catch (err) { console.error(`\n    ❌ lineups ${match.ext_id}: ${err.message}`); }
  }
  console.log(`\n  ✅ ${league.name}: lineups done (${done})`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Full Season 2025 Sync — 8 Major Leagues');
  console.log(`📊 Already done: ${Object.keys(progress.done).length} tasks | API calls: ${progress.apiCalls}\n`);
  for (const league of LEAGUES) {
    console.log(`\n${'='.repeat(50)}\n🏆 ${league.name}\n${'='.repeat(50)}`);
    await syncStandings(league);
    await syncScorers(league);
    await syncSquads(league);
    await syncTransfers(league);
    await syncMissingEvents(league);
    await syncMissingLineups(league);
  }
  console.log(`\n🎉 DONE! Total API calls: ${progress.apiCalls}`);
  await pool.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
