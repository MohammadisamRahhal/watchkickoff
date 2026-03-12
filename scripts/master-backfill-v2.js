const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const LOG_FILE = '/srv/watchkickoff/logs/master-backfill.log';
const PROGRESS_FILE = '/srv/watchkickoff/logs/master-backfill-progress.json';
const DAILY_LIMIT = 70000;

function log(msg) {
  const line = new Date().toISOString().slice(11,19) + ' ' + msg;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); }
  catch { return { phase:'events', dailyUsed:0, dailyReset:Date.now() }; }
}

function saveProgress(p) {
  const { doneIds, ...rest } = p;
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(rest));
}

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
  const json = await res.json();
  return json.response ?? [];
}

function mapEventType(type, detail) {
  if(type === 'Goal') {
    if(detail === 'Own Goal') return 'OWN_GOAL';
    if(detail === 'Penalty') return 'PENALTY_SCORED';
    return 'GOAL';
  }
  if(type === 'Card') {
    if(detail === 'Yellow Card') return 'YELLOW';
    if(detail === 'Red Card') return 'RED';
    return 'SECOND_YELLOW';
  }
  if(type === 'subst') return 'SUB_IN';
  return 'VAR';
}

async function buildLookupMaps() {
  log('Building lookup maps...');
  const { rows: teamRows } = await pool.query("SELECT id, provider_ref->>'apiFootball' as ext_id FROM teams WHERE provider_ref->>'apiFootball' IS NOT NULL");
  const teamMap = new Map(teamRows.map(r => [r.ext_id, r.id]));
  const { rows: playerRows } = await pool.query("SELECT id, provider_ref->>'apiFootball' as ext_id FROM players WHERE provider_ref->>'apiFootball' IS NOT NULL");
  const playerMap = new Map(playerRows.map(r => [r.ext_id, r.id]));
  log('Lookup maps ready: ' + teamMap.size + ' teams, ' + playerMap.size + ' players');
  return { teamMap, playerMap };
}

async function phaseEvents(p) {
  log('=== PHASE 1: EVENTS v2 ===');
  const { teamMap, playerMap } = await buildLookupMaps();
  const { rows } = await pool.query(`
    SELECT m.id, m.provider_ref->>'apiFootball' as ext_id
    FROM matches m
    WHERE m.status = 'FINISHED'
    AND m.kickoff_at > NOW() - INTERVAL '1 year'
    AND NOT EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id)
    ORDER BY m.kickoff_at DESC
  `);
  log('Matches without events: ' + rows.length);
  let done = 0; let errors = 0;
  for(const match of rows) {
    try {
      const evs = await apiGet('/fixtures/events?fixture=' + match.ext_id, p);
      await sleep(300);
      if(evs.length === 0) { done++; continue; }
      const values = []; const params = []; let pi = 1;
      for(const ev of evs) {
        const teamId = teamMap.get(String(ev.team?.id));
        if(!teamId) continue;
        const playerId = ev.player?.id ? (playerMap.get(String(ev.player.id)) ?? null) : null;
        const type = mapEventType(ev.type, ev.detail);
        const meta = JSON.stringify({ playerName: ev.player?.name ?? null, assistName: ev.assist?.name ?? null });
        values.push('(gen_random_uuid(),$' + pi + ',$' + (pi+1) + ',$' + (pi+2) + ',$' + (pi+3) + ',$' + (pi+4) + ',$' + (pi+5) + ',$' + (pi+6) + ',$' + (pi+7) + '::jsonb)');
        params.push(match.id, teamId, playerId, type, ev.time.elapsed??0, ev.time.extra??0, ev.detail??null, meta);
        pi += 8;
      }
      if(values.length > 0) {
        await pool.query('INSERT INTO match_events (id,match_id,team_id,player_id,event_type,minute,minute_extra,detail,meta) VALUES ' + values.join(',') + ' ON CONFLICT DO NOTHING', params);
      }
      done++;
      if(done % 100 === 0) { log('Events: ' + done + '/' + rows.length + ' | API used: ' + p.dailyUsed + ' | errors: ' + errors); saveProgress(p); }
    } catch(e) { log('ERR events ' + match.ext_id + ': ' + e.message); errors++; done++; }
  }
  log('Events phase complete: ' + done + ' done, ' + errors + ' errors');
  p.phase = 'lineups'; saveProgress(p);
}

async function phaseLineups(p) {
  log('=== PHASE 2: LINEUPS v2 ===');
  const { teamMap, playerMap } = await buildLookupMaps();
  const { rows } = await pool.query(`
    SELECT m.id, m.provider_ref->>'apiFootball' as ext_id
    FROM matches m
    WHERE m.status = 'FINISHED'
    AND m.kickoff_at > NOW() - INTERVAL '1 year'
    AND NOT EXISTS (SELECT 1 FROM match_lineups WHERE match_id = m.id)
    ORDER BY m.kickoff_at DESC
  `);
  log('Matches without lineups: ' + rows.length);
  let done = 0; let errors = 0;
  for(const match of rows) {
    try {
      const lineups = await apiGet('/fixtures/lineups?fixture=' + match.ext_id, p);
      await sleep(300);
      if(lineups.length === 0) { done++; continue; }
      const values = []; const params = []; let pi = 1;
      for(const lineup of lineups) {
        const teamId = teamMap.get(String(lineup.team?.id));
        if(!teamId) continue;
        const players = [
          ...(lineup.startXI||[]).map(s=>({...s.player, is_starter:true})),
          ...(lineup.substitutes||[]).map(s=>({...s.player, is_starter:false}))
        ];
        for(const pl of players) {
          const playerId = playerMap.get(String(pl.id));
          if(!playerId) continue;
          const slot = pl.grid ? parseInt(pl.grid.split(':')[0]) : null;
          values.push('(gen_random_uuid(),$' + pi + ',$' + (pi+1) + ',$' + (pi+2) + ',$' + (pi+3) + ',$' + (pi+4) + ',$' + (pi+5) + ',$' + (pi+6) + ',$' + (pi+7) + ',NOW())');
          params.push(match.id, teamId, playerId, pl.number??null, pl.pos??null, pl.is_starter, slot, pl.captain??false);
          pi += 8;
        }
      }
      if(values.length > 0) {
        await pool.query('INSERT INTO match_lineups (id,match_id,team_id,player_id,shirt_number,position_code,is_starter,formation_slot,is_captain,created_at) VALUES ' + values.join(',') + ' ON CONFLICT DO NOTHING', params);
      }
      done++;
      if(done % 100 === 0) { log('Lineups: ' + done + '/' + rows.length + ' | API used: ' + p.dailyUsed + ' | errors: ' + errors); saveProgress(p); }
    } catch(e) { log('ERR lineups ' + match.ext_id + ': ' + e.message); errors++; done++; }
  }
  log('Lineups phase complete: ' + done + ' done, ' + errors + ' errors');
  p.phase = 'scorers'; saveProgress(p);
}

async function phaseScorers(p) {
  log('=== PHASE 3: SCORERS v2 ===');
  const { rows } = await pool.query("SELECT l.id, l.provider_ref->>'apiFootball' as ext_id, l.season, l.name FROM leagues l WHERE l.provider_ref->>'apiFootball' IS NOT NULL AND NOT EXISTS (SELECT 1 FROM season_stats ss WHERE ss.league_id = l.id AND ss.season = l.season)");
  log('Leagues without scorers: ' + rows.length);
  let done = 0;
  for(const league of rows) {
    try {
      const scorers = await apiGet('/players/topscorers?league=' + league.ext_id + '&season=' + league.season, p);
      await sleep(300);
      for(const s of scorers) {
        const pr = await pool.query("SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1", [String(s.player.id)]);
        let playerId = pr.rows[0]?.id;
        if(!playerId) {
          const slug = s.player.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
          const ins = await pool.query("INSERT INTO players (id,name,slug,provider_ref,created_at) VALUES (gen_random_uuid(),$1,$2,$3::jsonb,NOW()) ON CONFLICT DO NOTHING RETURNING id", [s.player.name, slug, JSON.stringify({apiFootball:String(s.player.id)})]);
          playerId = ins.rows[0]?.id;
        }
        if(!playerId) continue;
        const tr = await pool.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1", [String(s.statistics[0].team.id)]);
        const teamId = tr.rows[0]?.id;
        if(!teamId) continue;
        await pool.query("INSERT INTO season_stats (id,player_id,team_id,league_id,season,goals,assists,appearances,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,NOW()) ON CONFLICT (player_id,league_id,season) DO UPDATE SET goals=EXCLUDED.goals,assists=EXCLUDED.assists,appearances=EXCLUDED.appearances,updated_at=NOW()", [playerId,teamId,league.id,String(league.season),s.statistics[0].goals.total??0,s.statistics[0].goals.assists??0,s.statistics[0].games.appearences??0]);
      }
      done++;
      if(done % 50 === 0) { log('Scorers: ' + done + '/' + rows.length + ' | API used: ' + p.dailyUsed); saveProgress(p); }
    } catch(e) { log('ERR scorers ' + league.ext_id + ': ' + e.message); done++; }
  }
  log('Scorers phase complete: ' + done);
  p.phase = 'standings'; saveProgress(p);
}

async function phaseStandings(p) {
  log('=== PHASE 4: STANDINGS v2 ===');
  const { rows } = await pool.query("SELECT id, provider_ref->>'apiFootball' as ext_id, season, name FROM leagues WHERE provider_ref->>'apiFootball' IS NOT NULL");
  log('Leagues for standings: ' + rows.length);
  let done = 0;
  for(const league of rows) {
    try {
      const data = await apiGet('/standings?league=' + league.ext_id + '&season=' + league.season, p);
      await sleep(300);
      const standingsArr = data[0]?.league?.standings?.[0] ?? [];
      for(const s of standingsArr) {
        const tr = await pool.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1", [String(s.team.id)]);
        const teamId = tr.rows[0]?.id;
        if(!teamId) continue;
        await pool.query("INSERT INTO standings (id,league_id,team_id,season,position,played,wins,draws,losses,goals_for,goals_against,points,form,zone,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()) ON CONFLICT (league_id,team_id,season) DO UPDATE SET position=EXCLUDED.position,played=EXCLUDED.played,wins=EXCLUDED.wins,draws=EXCLUDED.draws,losses=EXCLUDED.losses,goals_for=EXCLUDED.goals_for,goals_against=EXCLUDED.goals_against,points=EXCLUDED.points,form=EXCLUDED.form,zone=EXCLUDED.zone,updated_at=NOW()", [league.id,teamId,String(league.season),s.rank,s.all.played,s.all.win,s.all.draw,s.all.lose,s.goals.for,s.goals.against,s.points,s.form??null,'NORMAL']);
      }
      done++;
      if(done % 50 === 0) { log('Standings: ' + done + '/' + rows.length + ' | API used: ' + p.dailyUsed); saveProgress(p); }
    } catch(e) { log('ERR standings ' + league.ext_id + ': ' + e.message); done++; }
  }
  log('Standings phase complete: ' + done);
  p.phase = 'done'; saveProgress(p);
}

async function main() {
  log('=== MASTER BACKFILL v2 STARTED ===');
  const p = loadProgress();
  delete p.doneIds;
  log('Phase: ' + p.phase + ' | API used today: ' + p.dailyUsed);
  if(p.phase === 'events')    await phaseEvents(p);
  if(p.phase === 'lineups')   await phaseLineups(p);
  if(p.phase === 'scorers')   await phaseScorers(p);
  if(p.phase === 'standings') await phaseStandings(p);
  log('=== ALL DONE ===');
  await pool.end();
}

main().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
