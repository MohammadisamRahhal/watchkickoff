/**
 * master-backfill.js — النسخة الكاملة
 * =====================================
 * المراحل بالترتيب:
 *   1. events   — أحداث المباريات المنتهية
 *   2. lineups  — تشكيلات المباريات المنتهية
 *   3. fixtures — مباريات كل الدوريات (ماضي + مستقبل)
 *   4. standings — ترتيب كل الدوريات
 *   5. scorers  — أفضل هدافين كل دوري (إحصائيات كاملة)
 *   6. players  — كل اللاعبين كل الصفحات (الدوريات الكبيرة أولاً)
 *
 * يتوقف عند 72,000 call/day ويكمل من نفس المكان غداً بعد 06:00 UTC
 */

const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });
const API_KEY   = 'd8a653353374e0d1b32c7afb3adf30b2';
const PROGRESS  = '/srv/watchkickoff/logs/master-backfill-progress.json';
const LOG_FILE  = '/srv/watchkickoff/logs/master-backfill.log';
const DAILY_CAP = 72000;
const DELAY     = 350;

const TOP_IDS = [39,140,135,78,61,2,3,848,45,48,531,307,103,283,179,203,88,94,235,197,71,73,253,136,4,5,6,9,10,11,12,13,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,40,41,42,43,44,46,47,49,50,51,52,53,54,55,56,57,58,59,60,62,63,64,65,66,67,68,69,70,72,74,75,76,77,79,80];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) {
  const line = `${new Date().toISOString().slice(0,19).replace('T',' ')} ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}
function loadProgress() {
  try { if (fs.existsSync(PROGRESS)) return JSON.parse(fs.readFileSync(PROGRESS, 'utf8')); } catch {}
  return { phase:'events', dailyUsed:0, dailyReset:0, eventOffset:0, lineupOffset:0, fixtureOffset:0, standingOffset:0, scorerOffset:0, playerOffset:0 };
}
function saveProgress(p) { fs.writeFileSync(PROGRESS, JSON.stringify(p, null, 2)); }
function isNewDay(p) { return Date.now() > p.dailyReset; }
function setNextReset(p) {
  const r = new Date(); r.setUTCHours(6,5,0,0);
  if (r.getTime() <= Date.now()) r.setDate(r.getDate()+1);
  p.dailyReset = r.getTime();
}
async function apiGet(path) {
  const res = await fetch(`https://v3.football.api-sports.io${path}`, { headers:{'x-apisports-key':API_KEY} });
  const json = await res.json();
  return { data: json.response ?? [], paging: json.paging ?? {current:1,total:1} };
}
function mapEventType(type, detail) {
  if (type==='Goal') { if(detail==='Own Goal') return 'OWN_GOAL'; if(detail==='Penalty') return 'PENALTY_SCORED'; if(detail==='Missed Penalty') return 'PENALTY_MISSED'; return 'GOAL'; }
  if (type==='Card') { if(detail==='Red Card') return 'RED'; if(detail==='Second Yellow Card') return 'SECOND_YELLOW'; return 'YELLOW'; }
  if (type==='subst') return 'SUB_IN';
  return 'VAR';
}
function normalizeStatus(s) {
  const m={'TBD':'SCHEDULED','NS':'SCHEDULED','1H':'LIVE_1H','HT':'HALF_TIME','2H':'LIVE_2H','ET':'EXTRA_TIME','P':'PENALTIES','FT':'FINISHED','AET':'FINISHED','PEN':'FINISHED','PST':'POSTPONED','CANC':'CANCELLED','SUSP':'SUSPENDED','AWD':'AWARDED','WO':'AWARDED','ABD':'CANCELLED'};
  return m[s] ?? 'SCHEDULED';
}
async function resolveOrCreatePlayer(p) {
  let res = await pool.query(`SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1`,[String(p.id)]);
  if (res.rows[0]) {
    await pool.query(`UPDATE players SET nationality_code=COALESCE(nationality_code,$1),date_of_birth=COALESCE(date_of_birth,$2),height_cm=COALESCE(height_cm,$3),updated_at=NOW() WHERE id=$4`,
      [p.nationality?p.nationality.slice(0,2).toUpperCase():null, p.birth?.date||null, p.height?parseInt(p.height):null, res.rows[0].id]);
    return res.rows[0].id;
  }
  const slug=`player-${p.id}-${(p.name||'').toLowerCase().replace(/[^a-z0-9]/g,'-').slice(0,50)}`;
  await pool.query(`INSERT INTO players (id,name,slug,nationality_code,date_of_birth,height_cm,provider_ref,status,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6::jsonb,'ACTIVE',NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET provider_ref=EXCLUDED.provider_ref,updated_at=NOW()`,
    [p.name,slug,p.nationality?p.nationality.slice(0,2).toUpperCase():null,p.birth?.date||null,p.height?parseInt(p.height):null,JSON.stringify({apiFootball:String(p.id)})]);
  res = await pool.query(`SELECT id FROM players WHERE slug=$1`,[slug]);
  return res.rows[0]?.id??null;
}
async function upsertSeasonStat(playerId,teamId,leagueId,season,s) {
  await pool.query(`INSERT INTO season_stats (id,player_id,team_id,league_id,season,goals,assists,appearances,minutes_played,yellow_cards,red_cards,shots_total,shots_on_target,passes_total,pass_accuracy,rating,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()) ON CONFLICT (player_id,league_id,season) DO UPDATE SET goals=EXCLUDED.goals,assists=EXCLUDED.assists,appearances=EXCLUDED.appearances,minutes_played=EXCLUDED.minutes_played,yellow_cards=EXCLUDED.yellow_cards,red_cards=EXCLUDED.red_cards,shots_total=EXCLUDED.shots_total,shots_on_target=EXCLUDED.shots_on_target,passes_total=EXCLUDED.passes_total,pass_accuracy=EXCLUDED.pass_accuracy,rating=EXCLUDED.rating,updated_at=NOW()`,
    [playerId,teamId,leagueId,season,s.goals?.total??0,s.goals?.assists??0,s.games?.appearences??0,s.games?.minutes??0,s.cards?.yellow??0,s.cards?.red??0,s.shots?.total??0,s.shots?.on??0,s.passes?.total??0,s.passes?.accuracy??null,s.games?.rating?parseFloat(s.games.rating):null]);
}

async function phaseEvents(p) {
  log('=== PHASE 1: EVENTS ===');
  const {rows:matches} = await pool.query(`SELECT m.id, m.provider_ref->>'apiFootball' as ext_id FROM matches m WHERE m.status='FINISHED' AND m.kickoff_at>NOW()-INTERVAL '1 year' AND NOT EXISTS (SELECT 1 FROM match_events WHERE match_id=m.id) ORDER BY m.kickoff_at DESC OFFSET $1`,[p.eventOffset]);
  log(`${matches.length} matches without events`);
  for (const match of matches) {
    if (p.dailyUsed>=DAILY_CAP) { log('⏸ Cap reached'); return false; }
    if (!match.ext_id) { p.eventOffset++; continue; }
    try {
      const {data:evs} = await apiGet(`/fixtures/events?fixture=${match.ext_id}`);
      p.dailyUsed++; p.eventOffset++;
      for (const ev of evs) {
        try {
          const tr = await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`,[String(ev.team.id)]);
          const teamId=tr.rows[0]?.id; if(!teamId) continue;
          let playerId=null;
          if(ev.player?.id){const pr=await pool.query(`SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1`,[String(ev.player.id)]);playerId=pr.rows[0]?.id??null;}
          const meta=JSON.stringify({playerName:ev.player?.name??null,assistName:ev.assist?.name??null});
          await pool.query(`INSERT INTO match_events (id,match_id,team_id,player_id,event_type,minute,minute_extra,detail,meta) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8::jsonb) ON CONFLICT DO NOTHING`,
            [match.id,teamId,playerId,mapEventType(ev.type,ev.detail),ev.time.elapsed??0,ev.time.extra??0,ev.detail??null,meta]);
        } catch {}
      }
      await sleep(DELAY); saveProgress(p);
      if(p.eventOffset%200===0) log(`Events: ${p.eventOffset} | used: ${p.dailyUsed}`);
    } catch(e) { log(`ERR events ${match.ext_id}: ${e.message}`); p.eventOffset++; await sleep(1000); }
  }
  log(`✅ Events complete`); return true;
}

async function phaseLineups(p) {
  log('=== PHASE 2: LINEUPS ===');
  const {rows:matches} = await pool.query(`SELECT m.id, m.provider_ref->>'apiFootball' as ext_id FROM matches m WHERE m.status='FINISHED' AND m.kickoff_at>NOW()-INTERVAL '1 year' AND NOT EXISTS (SELECT 1 FROM match_lineups WHERE match_id=m.id) ORDER BY m.kickoff_at DESC OFFSET $1`,[p.lineupOffset]);
  log(`${matches.length} matches without lineups (offset ${p.lineupOffset})`);
  for (const match of matches) {
    if (p.dailyUsed>=DAILY_CAP) { log('⏸ Cap reached'); return false; }
    if (!match.ext_id) { p.lineupOffset++; continue; }
    try {
      const {data:lineups} = await apiGet(`/fixtures/lineups?fixture=${match.ext_id}`);
      p.dailyUsed++; p.lineupOffset++;
      for (const lineup of lineups) {
        const tr=await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`,[String(lineup.team.id)]);
        const teamId=tr.rows[0]?.id; if(!teamId) continue;
        const players=[...(lineup.startXI||[]).map(s=>({...s.player,is_starter:true})),...(lineup.substitutes||[]).map(s=>({...s.player,is_starter:false}))];
        for (const pl of players) {
          const pr=await pool.query(`SELECT id FROM players WHERE provider_ref->>'apiFootball'=$1`,[String(pl.id)]);
          const playerId=pr.rows[0]?.id; if(!playerId) continue;
          const slot=pl.grid?parseInt(pl.grid.split(':')[0]):null;
          await pool.query(`INSERT INTO match_lineups (id,match_id,team_id,player_id,shirt_number,position_code,is_starter,formation_slot,is_captain,created_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,NOW()) ON CONFLICT DO NOTHING`,
            [match.id,teamId,playerId,pl.number??null,pl.pos??null,pl.is_starter,slot,pl.captain??false]);
        }
      }
      await sleep(DELAY); saveProgress(p);
      if(p.lineupOffset%200===0) log(`Lineups: ${p.lineupOffset} | used: ${p.dailyUsed}`);
    } catch(e) { log(`ERR lineups ${match.ext_id}: ${e.message}`); p.lineupOffset++; await sleep(1000); }
  }
  log(`✅ Lineups complete`); return true;
}

async function phaseFixtures(p) {
  log('=== PHASE 3: FIXTURES ===');
  const {rows:leagues} = await pool.query(`SELECT id,name,season,provider_ref->>'apiFootball' AS ext_id FROM leagues WHERE is_active=true AND season IN ('2025','2026') AND provider_ref->>'apiFootball' IS NOT NULL ORDER BY CASE WHEN (provider_ref->>'apiFootball')::int=ANY($1::int[]) THEN 0 ELSE 1 END,name OFFSET $2`,[TOP_IDS,p.fixtureOffset]);
  log(`${leagues.length} leagues remaining`);
  for (const league of leagues) {
    if (p.dailyUsed>=DAILY_CAP) { log('⏸ Cap reached'); return false; }
    try {
      const {data:fixtures} = await apiGet(`/fixtures?league=${league.ext_id}&season=${league.season}`);
      p.dailyUsed++; p.fixtureOffset++;
      for (const fx of fixtures) {
        try {
          const htExtId=String(fx.teams.home.id);
          let htRes=await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`,[htExtId]);
          if(!htRes.rows[0]){const slug=(fx.teams.home.name||'team').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,100);await pool.query(`INSERT INTO teams (id,name,slug,country_code,crest_url,provider_ref,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,'WW',$3,$4::jsonb,NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET crest_url=EXCLUDED.crest_url,updated_at=NOW()`,[fx.teams.home.name,slug,fx.teams.home.logo??null,JSON.stringify({apiFootball:htExtId})]);htRes=await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`,[htExtId]);}
          const atExtId=String(fx.teams.away.id);
          let atRes=await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`,[atExtId]);
          if(!atRes.rows[0]){const slug=(fx.teams.away.name||'team').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,100);await pool.query(`INSERT INTO teams (id,name,slug,country_code,crest_url,provider_ref,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,'WW',$3,$4::jsonb,NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET crest_url=EXCLUDED.crest_url,updated_at=NOW()`,[fx.teams.away.name,slug,fx.teams.away.logo??null,JSON.stringify({apiFootball:atExtId})]);atRes=await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`,[atExtId]);}
          const homeTeamId=htRes.rows[0]?.id; const awayTeamId=atRes.rows[0]?.id;
          if(!homeTeamId||!awayTeamId) continue;
          const htSlug=(fx.teams.home.name||'home').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,50);
          const atSlug=(fx.teams.away.name||'away').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,50);
          const dateStr=new Date(fx.fixture.timestamp*1000).toISOString().slice(0,10);
          const matchSlug=`${htSlug}-vs-${atSlug}-${dateStr}`;
          await pool.query(`INSERT INTO matches (id,slug,league_id,home_team_id,away_team_id,kickoff_at,status,home_score,away_score,home_score_ht,away_score_ht,minute,season,round,venue,raw_status,provider_ref,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,to_timestamp($5),$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET status=EXCLUDED.status,home_score=EXCLUDED.home_score,away_score=EXCLUDED.away_score,home_score_ht=EXCLUDED.home_score_ht,away_score_ht=EXCLUDED.away_score_ht,minute=EXCLUDED.minute,raw_status=EXCLUDED.raw_status,updated_at=NOW()`,
            [matchSlug,league.id,homeTeamId,awayTeamId,fx.fixture.timestamp,normalizeStatus(fx.fixture.status.short),fx.goals.home??0,fx.goals.away??0,fx.score.halftime.home??null,fx.score.halftime.away??null,fx.fixture.status.elapsed??null,String(league.season),fx.league.round??null,fx.fixture.venue?.name??null,fx.fixture.status.short,JSON.stringify({apiFootball:String(fx.fixture.id)})]);
        } catch {}
      }
      await sleep(DELAY); saveProgress(p);
      if(p.fixtureOffset%50===0) log(`Fixtures: ${p.fixtureOffset} leagues | used: ${p.dailyUsed}`);
    } catch(e) { log(`ERR fixtures ${league.name}: ${e.message}`); p.fixtureOffset++; await sleep(1000); }
  }
  log(`✅ Fixtures complete`); return true;
}

async function phaseStandings(p) {
  log('=== PHASE 4: STANDINGS ===');
  const {rows:leagues} = await pool.query(`SELECT id,name,season,provider_ref->>'apiFootball' AS ext_id FROM leagues WHERE is_active=true AND season IN ('2025','2026') AND provider_ref->>'apiFootball' IS NOT NULL ORDER BY CASE WHEN (provider_ref->>'apiFootball')::int=ANY($1::int[]) THEN 0 ELSE 1 END,name OFFSET $2`,[TOP_IDS,p.standingOffset]);
  log(`${leagues.length} leagues remaining`);
  for (const league of leagues) {
    if (p.dailyUsed>=DAILY_CAP) { log('⏸ Cap reached'); return false; }
    try {
      const {data} = await apiGet(`/standings?league=${league.ext_id}&season=${league.season}`);
      p.dailyUsed++; p.standingOffset++;
      const arr=data[0]?.league?.standings?.[0]??[];
      for (const s of arr) {
        try {
          const tr=await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`,[String(s.team.id)]);
          const teamId=tr.rows[0]?.id; if(!teamId) continue;
          const zone=s.description?.toLowerCase().includes('promotion')?'PROMOTION':s.description?.toLowerCase().includes('relegation')?'RELEGATION':s.description?.toLowerCase().includes('champions')?'CHAMPIONSHIP':'NONE';
          await pool.query(`INSERT INTO standings (id,league_id,team_id,season,position,played,wins,draws,losses,goals_for,goals_against,points,form,zone,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()) ON CONFLICT (league_id,team_id,season) DO UPDATE SET position=EXCLUDED.position,played=EXCLUDED.played,wins=EXCLUDED.wins,draws=EXCLUDED.draws,losses=EXCLUDED.losses,goals_for=EXCLUDED.goals_for,goals_against=EXCLUDED.goals_against,points=EXCLUDED.points,form=EXCLUDED.form,zone=EXCLUDED.zone,updated_at=NOW()`,
            [league.id,teamId,String(league.season),s.rank,s.all.played,s.all.win,s.all.draw,s.all.lose,s.goals.for,s.goals.against,s.points,s.form??null,zone]);
        } catch {}
      }
      await sleep(DELAY); saveProgress(p);
      if(p.standingOffset%50===0) log(`Standings: ${p.standingOffset} leagues | used: ${p.dailyUsed}`);
    } catch(e) { log(`ERR standings ${league.name}: ${e.message}`); p.standingOffset++; await sleep(1000); }
  }
  log(`✅ Standings complete`); return true;
}

async function phaseScorers(p) {
  log('=== PHASE 5: SCORERS ===');
  const {rows:leagues} = await pool.query(`SELECT id,name,season,provider_ref->>'apiFootball' AS ext_id FROM leagues WHERE is_active=true AND season IN ('2025','2026') AND provider_ref->>'apiFootball' IS NOT NULL ORDER BY CASE WHEN (provider_ref->>'apiFootball')::int=ANY($1::int[]) THEN 0 ELSE 1 END,name OFFSET $2`,[TOP_IDS,p.scorerOffset]);
  log(`${leagues.length} leagues remaining`);
  for (const league of leagues) {
    if (p.dailyUsed>=DAILY_CAP) { log('⏸ Cap reached'); return false; }
    try {
      const {data:scorers} = await apiGet(`/players/topscorers?league=${league.ext_id}&season=${league.season}`);
      p.dailyUsed++; p.scorerOffset++;
      for (const entry of scorers) {
        try {
          const pl=entry.player; const st=entry.statistics?.[0]; if(!st) continue;
          const playerId=await resolveOrCreatePlayer(pl); if(!playerId) continue;
          const tr=await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`,[String(st.team.id)]);
          const teamId=tr.rows[0]?.id; if(!teamId) continue;
          await upsertSeasonStat(playerId,teamId,league.id,String(league.season),st);
        } catch {}
      }
      await sleep(DELAY); saveProgress(p);
      if(p.scorerOffset%100===0) log(`Scorers: ${p.scorerOffset} leagues | used: ${p.dailyUsed}`);
    } catch(e) { log(`ERR scorers ${league.name}: ${e.message}`); p.scorerOffset++; await sleep(1000); }
  }
  log(`✅ Scorers complete`); return true;
}

async function phasePlayers(p) {
  log('=== PHASE 6: PLAYERS (all pages) ===');
  const {rows:leagues} = await pool.query(`SELECT id,name,season,provider_ref->>'apiFootball' AS ext_id FROM leagues WHERE is_active=true AND season IN ('2025','2026') AND provider_ref->>'apiFootball' IS NOT NULL ORDER BY CASE WHEN (provider_ref->>'apiFootball')::int=ANY($1::int[]) THEN 0 ELSE 1 END,name OFFSET $2`,[TOP_IDS,p.playerOffset]);
  log(`${leagues.length} leagues remaining`);
  for (const league of leagues) {
    if (p.dailyUsed>=DAILY_CAP) { log('⏸ Cap reached'); return false; }
    try {
      const first=await apiGet(`/players?league=${league.ext_id}&season=${league.season}&page=1`);
      p.dailyUsed++;
      const totalPages=first.paging.total??1;
      await processPlayerPage(first.data,league);
      for (let page=2;page<=totalPages;page++) {
        if(p.dailyUsed>=DAILY_CAP){log(`⏸ Cap mid-league ${league.name}`);saveProgress(p);return false;}
        const next=await apiGet(`/players?league=${league.ext_id}&season=${league.season}&page=${page}`);
        p.dailyUsed++;
        await processPlayerPage(next.data,league);
        await sleep(DELAY);
      }
      p.playerOffset++; await sleep(DELAY); saveProgress(p);
      if(p.playerOffset%20===0) log(`Players: ${p.playerOffset} leagues | used: ${p.dailyUsed}`);
    } catch(e) { log(`ERR players ${league.name}: ${e.message}`); p.playerOffset++; await sleep(1000); }
  }
  log(`✅ Players complete`); return true;
}

async function processPlayerPage(players,league) {
  for (const entry of players) {
    try {
      const pl=entry.player; const st=entry.statistics?.[0]; if(!st) continue;
      const playerId=await resolveOrCreatePlayer(pl); if(!playerId) continue;
      const tr=await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1`,[String(st.team.id)]);
      const teamId=tr.rows[0]?.id; if(!teamId) continue;
      await upsertSeasonStat(playerId,teamId,league.id,String(league.season),st);
    } catch {}
  }
}

async function main() {
  const p = loadProgress();
  if (isNewDay(p)) { log('🔄 New day — resetting daily counter'); p.dailyUsed=0; setNextReset(p); }
  log(`🚀 master-backfill | phase: ${p.phase} | used: ${p.dailyUsed}/${DAILY_CAP}`);
  saveProgress(p);

  const phases = [
    ['events',   phaseEvents],
    ['lineups',  phaseLineups],
    ['fixtures', phaseFixtures],
    ['standings',phaseStandings],
    ['scorers',  phaseScorers],
    ['players',  phasePlayers],
  ];

  for (const [name,fn] of phases) {
    if (p.phase !== name) continue;
    const done = await fn(p);
    if (!done) {
      log(`⏸ Stopped at phase: ${p.phase} | used: ${p.dailyUsed}/${DAILY_CAP}`);
      log('▶ Run again tomorrow after 06:05 UTC');
      await pool.end(); return;
    }
    const idx = phases.findIndex(([n])=>n===name);
    if (phases[idx+1]) { p.phase=phases[idx+1][0]; saveProgress(p); }
  }

  log('🎉 ALL PHASES COMPLETE — all data imported!');
  await pool.end();
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
