const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const PROGRESS_FILE = '/srv/watchkickoff/logs/master-backfill-progress.json';
const LOG_FILE = '/srv/watchkickoff/logs/master-backfill.log';
const DAILY_LIMIT = 70000;

function log(msg) {
  const line = new Date().toISOString().slice(11,19) + ' ' + msg;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}
function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); }
  catch { return { phase:'events', doneIds:[], dailyUsed:0, dailyReset:Date.now() }; }
}
function saveProgress(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p)); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function checkQuota(p) {
  if(Date.now() - p.dailyReset > 24*60*60*1000) { p.dailyUsed=0; p.dailyReset=Date.now(); log('Quota reset'); }
  if(p.dailyUsed >= DAILY_LIMIT) {
    const reset = new Date(); reset.setUTCHours(6,0,0,0);
    if(reset < new Date()) reset.setDate(reset.getDate()+1);
    const waitMs = reset - Date.now();
    log('Quota reached - sleeping ' + Math.round(waitMs/3600000) + 'h until 06:00 UTC');
    saveProgress(p);
    await sleep(waitMs + 60000);
    p.dailyUsed=0; p.dailyReset=Date.now(); log('Resuming after quota reset');
  }
}
async function apiGet(path, p) {
  await checkQuota(p);
  const res = await fetch('https://v3.football.api-sports.io' + path, { headers:{'x-apisports-key':API_KEY} });
  p.dailyUsed++;
  return (await res.json()).response ?? [];
}

async function phaseEvents(p) {
  log('=== PHASE 1: EVENTS ===');
  const { rows } = await pool.query(`
    SELECT m.id, m.provider_ref->>'apiFootball' as ext_id
    FROM matches m
    WHERE m.status = 'FINISHED'
    AND m.kickoff_at > NOW() - INTERVAL '1 year'
    AND NOT EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id)
    ORDER BY m.kickoff_at DESC
  `);
  log('Found ' + rows.length + ' matches without events');
  let done = 0;
  for (const match of rows) {
    if(p.doneIds.includes(match.id)) { done++; continue; }
    try {
      const evs = await apiGet('/fixtures/events?fixture=' + match.ext_id, p);
      await sleep(300);
      for (const ev of evs) {
        const tr = await pool.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1", [String(ev.team.id)]);
        const teamId = tr.rows[0]?.id;
        if(!teamId) continue;
        let playerId = null;
        if(ev.player?.id) {
          const pr = await pool.query("SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1", [String(ev.player.id)]);
          playerId = pr.rows[0]?.id ?? null;
        }
        const meta = JSON.stringify({ playerName: ev.player?.name ?? null, assistName: ev.assist?.name ?? null });
        const type = ev.type === 'Goal' ? (ev.detail === 'Own Goal' ? 'OWN_GOAL' : ev.detail === 'Penalty' ? 'PENALTY_SCORED' : 'GOAL')
          : ev.type === 'Card' ? (ev.detail === 'Yellow Card' ? 'YELLOW' : ev.detail === 'Red Card' ? 'RED' : 'SECOND_YELLOW')
          : ev.type === 'subst' ? 'SUB_IN'
          : ev.type === 'Var' ? 'VAR' : 'OTHER';
        await pool.query(`INSERT INTO match_events (id,match_id,team_id,player_id,event_type,minute,minute_extra,detail,meta)
          VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8::jsonb) ON CONFLICT DO NOTHING`,
          [match.id,teamId,playerId,type,ev.time.elapsed??0,ev.time.extra??0,ev.detail??null,meta]);
      }
      p.doneIds.push(match.id);
      done++;
      if(done % 100 === 0) { log('Events: ' + done + '/' + rows.length + ' | API used: ' + p.dailyUsed); saveProgress(p); }
    } catch(e) { log('ERR events ' + match.ext_id + ': ' + e.message); done++; }
  }
  log('Events phase complete: ' + done);
  p.phase='lineups'; p.doneIds=[]; saveProgress(p);
}

async function phaseLineups(p) {
  log('=== PHASE 2: LINEUPS ===');
  const { rows } = await pool.query(`
    SELECT m.id, m.provider_ref->>'apiFootball' as ext_id
    FROM matches m
    WHERE m.status = 'FINISHED'
    AND m.kickoff_at > NOW() - INTERVAL '1 year'
    AND NOT EXISTS (SELECT 1 FROM match_lineups WHERE match_id = m.id)
    ORDER BY m.kickoff_at DESC
  `);
  log('Found ' + rows.length + ' matches without lineups');
  let done = 0;
  for (const match of rows) {
    if(p.doneIds.includes(match.id)) { done++; continue; }
    try {
      const lineups = await apiGet('/fixtures/lineups?fixture=' + match.ext_id, p);
      await sleep(300);
      for (const lineup of lineups) {
        const tr = await pool.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1", [String(lineup.team.id)]);
        const teamId = tr.rows[0]?.id;
        if(!teamId) continue;
        const players = [...(lineup.startXI||[]).map(s=>({...s.player,is_starter:true})), ...(lineup.substitutes||[]).map(s=>({...s.player,is_starter:false}))];
        for (const pl of players) {
          const pr = await pool.query("SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1", [String(pl.id)]);
          const playerId = pr.rows[0]?.id;
          if(!playerId) continue;
          const slot = pl.grid ? parseInt(pl.grid.split(':')[0]) : null;
          await pool.query(`INSERT INTO match_lineups (id,match_id,team_id,player_id,shirt_number,position_code,is_starter,formation_slot,is_captain,created_at)
            VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,NOW()) ON CONFLICT DO NOTHING`,
            [match.id,teamId,playerId,pl.number??null,pl.pos??null,pl.is_starter,slot,pl.captain??false]);
        }
      }
      p.doneIds.push(match.id);
      done++;
      if(done % 100 === 0) { log('Lineups: ' + done + '/' + rows.length + ' | API used: ' + p.dailyUsed); saveProgress(p); }
    } catch(e) { log('ERR lineups ' + match.ext_id + ': ' + e.message); done++; }
  }
  log('Lineups phase complete: ' + done);
  p.phase='scorers'; p.doneIds=[]; saveProgress(p);
}

async function phaseScorers(p) {
  log('=== PHASE 3: SCORERS ===');
  const { rows } = await pool.query("SELECT id, provider_ref->>'apiFootball' as ext_id, season, name FROM leagues WHERE provider_ref->>'apiFootball' IS NOT NULL");
  log('Found ' + rows.length + ' leagues');
  let done = 0;
  for (const league of rows) {
    if(p.doneIds.includes(league.id)) { done++; continue; }
    try {
      const scorers = await apiGet('/players/topscorers?league=' + league.ext_id + '&season=' + league.season, p);
      await sleep(300);
      for (const s of scorers) {
        const pr = await pool.query("SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1", [String(s.player.id)]);
        let playerId = pr.rows[0]?.id;
        if(!playerId) {
          const slug = s.player.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
          const ins = await pool.query(`INSERT INTO players (id,name,slug,provider_ref,created_at) VALUES (gen_random_uuid(),$1,$2,$3::jsonb,NOW()) ON CONFLICT DO NOTHING RETURNING id`,
            [s.player.name, slug, JSON.stringify({apiFootball:String(s.player.id)})]);
          playerId = ins.rows[0]?.id;
        }
        if(!playerId) continue;
        const tr = await pool.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1", [String(s.statistics[0].team.id)]);
        const teamId = tr.rows[0]?.id;
        if(!teamId) continue;
        await pool.query(`INSERT INTO season_stats (id,player_id,team_id,league_id,season,goals,assists,appearances,updated_at)
          VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,NOW())
          ON CONFLICT (player_id,league_id,season) DO UPDATE SET goals=EXCLUDED.goals,assists=EXCLUDED.assists,appearances=EXCLUDED.appearances,updated_at=NOW()`,
          [playerId,teamId,league.id,String(league.season),s.statistics[0].goals.total??0,s.statistics[0].goals.assists??0,s.statistics[0].games.appearences??0]);
      }
      p.doneIds.push(league.id);
      done++;
      if(done % 50 === 0) { log('Scorers: ' + done + '/' + rows.length + ' | API used: ' + p.dailyUsed); saveProgress(p); }
    } catch(e) { log('ERR scorers ' + league.ext_id + ': ' + e.message); done++; }
  }
  log('Scorers phase complete: ' + done);
  p.phase='standings'; p.doneIds=[]; saveProgress(p);
}

async function phaseStandings(p) {
  log('=== PHASE 4: STANDINGS ===');
  const { rows } = await pool.query("SELECT id, provider_ref->>'apiFootball' as ext_id, season, name FROM leagues WHERE provider_ref->>'apiFootball' IS NOT NULL");
  log('Found ' + rows.length + ' leagues');
  let done = 0;
  for (const league of rows) {
    if(p.doneIds.includes(league.id)) { done++; continue; }
    try {
      const data = await apiGet('/standings?league=' + league.ext_id + '&season=' + league.season, p);
      await sleep(300);
      const standingsArr = data[0]?.league?.standings?.[0] ?? [];
      for (const s of standingsArr) {
        const tr = await pool.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1", [String(s.team.id)]);
        const teamId = tr.rows[0]?.id;
        if(!teamId) continue;
        await pool.query(`INSERT INTO standings (id,league_id,team_id,season,position,played,wins,draws,losses,goals_for,goals_against,points,form,zone,updated_at)
          VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
          ON CONFLICT (league_id,team_id,season) DO UPDATE SET position=EXCLUDED.position,played=EXCLUDED.played,wins=EXCLUDED.wins,draws=EXCLUDED.draws,losses=EXCLUDED.losses,goals_for=EXCLUDED.goals_for,goals_against=EXCLUDED.goals_against,points=EXCLUDED.points,form=EXCLUDED.form,zone=EXCLUDED.zone,updated_at=NOW()`,
          [league.id,teamId,String(league.season),s.rank,s.all.played,s.all.win,s.all.draw,s.all.lose,s.goals.for,s.goals.against,s.points,s.form??null,'NORMAL']);
      }
      p.doneIds.push(league.id);
      done++;
      if(done % 50 === 0) { log('Standings: ' + done + '/' + rows.length + ' | API used: ' + p.dailyUsed); saveProgress(p); }
    } catch(e) { log('ERR standings ' + league.ext_id + ': ' + e.message); done++; }
  }
  log('Standings phase complete: ' + done);
  p.phase='done'; saveProgress(p);
}

async function main() {
  log('=== MASTER BACKFILL STARTED ===');
  const p = loadProgress();
  log('Resuming from phase: ' + p.phase + ' | API used today: ' + p.dailyUsed);
  if(p.phase === 'events')    await phaseEvents(p);
  if(p.phase === 'lineups')   await phaseLineups(p);
  if(p.phase === 'scorers')   await phaseScorers(p);
  if(p.phase === 'standings') await phaseStandings(p);
  log('=== ALL DONE ===');
  await pool.end();
}
main().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
