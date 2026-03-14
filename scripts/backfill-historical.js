const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', user:'postgres', password:'WatchKick2026', database:'watchkickoff' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const delay = ms => new Promise(r => setTimeout(r, ms));

const BIG_LEAGUES = [
  { name:'Premier League',   apiId:39  },
  { name:'La Liga',          apiId:140 },
  { name:'Serie A',          apiId:135 },
  { name:'Bundesliga',       apiId:78  },
  { name:'Ligue 1',          apiId:61  },
  { name:'Champions League', apiId:2   },
  { name:'Europa League',    apiId:3   },
  { name:'Saudi Pro League', apiId:307 },
];

const FROM_YEAR = 2015;
const TO_YEAR   = 2024;

// تتبع الـ quota
let dailyUsed = 0;
const DAILY_LIMIT = 140000;

async function apiGet(path) {
  if (dailyUsed >= DAILY_LIMIT) {
    console.log('⚠️  Daily limit reached! Saving progress and stopping...');
    await saveProgress();
    process.exit(0);
  }
  const res = await fetch('https://v3.football.api-sports.io' + path, {
    headers: { 'x-apisports-key': API_KEY }
  });
  dailyUsed++;
  if (dailyUsed % 500 === 0) console.log('📊 API requests used today: ' + dailyUsed);
  const json = await res.json();
  return json.response ?? [];
}

// حفظ التقدم
let progress = { league: 0, season: 0, phase: 'fixtures' };
async function saveProgress() {
  const fs = require('fs');
  fs.writeFileSync('/srv/watchkickoff/logs/historical-progress.json', JSON.stringify({ ...progress, dailyUsed }));
}

async function loadProgress() {
  try {
    const fs = require('fs');
    if (fs.existsSync('/srv/watchkickoff/logs/historical-progress.json')) {
      const p = JSON.parse(fs.readFileSync('/srv/watchkickoff/logs/historical-progress.json'));
      console.log('📂 Resuming from: League ' + p.league + ' Season ' + p.season + ' Phase: ' + p.phase);
      dailyUsed = 0; // reset daily counter
      return p;
    }
  } catch(e) {}
  return null;
}

async function upsertTeam(t) {
  if (!t?.id) return null;
  const slug = (t.name||'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + t.id;
  await pool.query(`
    INSERT INTO teams (name, slug, crest_url, country_code, provider_ref)
    VALUES ($1,$2,$3,'WW',$4)
    ON CONFLICT (slug) DO UPDATE SET crest_url=EXCLUDED.crest_url, name=EXCLUDED.name
  `, [t.name||'Unknown', slug, t.logo||null, JSON.stringify({apiFootball:String(t.id)})]);
  const {rows} = await pool.query('SELECT id FROM teams WHERE slug=$1',[slug]);
  return rows[0]?.id ?? null;
}

async function upsertPlayer(p) {
  if (!p?.id) return null;
  const slug = (p.name||'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + p.id;
  const pos = p.position==='Goalkeeper'?'GK':p.position==='Defender'?'DEF':p.position==='Midfielder'?'MID':'FWD';
  await pool.query(`
    INSERT INTO players (name, slug, nationality_code, date_of_birth, height_cm, position, provider_ref)
    VALUES ($1,$2,$3,$4,$5,$6::player_position,$7)
    ON CONFLICT (slug) DO UPDATE SET
      nationality_code=COALESCE(players.nationality_code,EXCLUDED.nationality_code),
      date_of_birth=COALESCE(players.date_of_birth,EXCLUDED.date_of_birth),
      height_cm=COALESCE(players.height_cm,EXCLUDED.height_cm)
  `, [
    p.name||'Unknown', slug,
    p.nationality?.substring(0,2)||null,
    p.birth?.date||null,
    p.height?parseInt(p.height):null,
    pos,
    JSON.stringify({apiFootball:String(p.id)})
  ]);
  const {rows} = await pool.query('SELECT id FROM players WHERE slug=$1',[slug]);
  return rows[0]?.id ?? null;
}

async function processFixtures(apiId, season, leagueId) {
  const fixtures = await apiGet('/fixtures?league='+apiId+'&season='+season);
  await delay(250);

  const statusMap = {
    'FT':'FINISHED','AET':'FINISHED','PEN':'FINISHED',
    'NS':'SCHEDULED','TBD':'SCHEDULED',
    '1H':'LIVE_1H','HT':'HALF_TIME','2H':'LIVE_2H',
    'ET':'EXTRA_TIME','P':'PENALTIES',
    'PST':'POSTPONED','CANC':'CANCELLED','SUSP':'SUSPENDED','AWD':'AWARDED',
  };

  let count = 0;
  for (const f of fixtures) {
    const fix=f.fixture, home=f.teams.home, away=f.teams.away, goals=f.goals;
    const homeId = await upsertTeam(home);
    const awayId = await upsertTeam(away);
    if (!homeId||!awayId) continue;

    const status = statusMap[fix.status?.short]??'SCHEDULED';
    const kickoff = fix.date ? new Date(fix.date).toISOString() : null;
    if (!kickoff) continue;

    const slug = (home.name||'home').toLowerCase().replace(/[^a-z0-9]+/g,'-')
      +'-vs-'+(away.name||'away').toLowerCase().replace(/[^a-z0-9]+/g,'-')
      +'-'+fix.date?.slice(0,10)+'-'+fix.id;

    await pool.query(`
      INSERT INTO matches (slug,league_id,home_team_id,away_team_id,kickoff_at,status,home_score,away_score,season,provider_ref)
      VALUES ($1,$2,$3,$4,$5,$6::match_status,$7,$8,$9,$10)
      ON CONFLICT (slug) DO UPDATE SET
        status=EXCLUDED.status,
        home_score=EXCLUDED.home_score,
        away_score=EXCLUDED.away_score
    `, [slug,leagueId,homeId,awayId,kickoff,status,
        goals.home??0,goals.away??0,String(season),
        JSON.stringify({apiFootball:String(fix.id)})]);
    count++;
  }
  return { count, fixtures };
}

async function processEvents(fixtures) {
  let count = 0;
  for (const f of fixtures) {
    const fixId = f.fixture?.id;
    if (!fixId) continue;
    if (f.fixture?.status?.short !== 'FT' && f.fixture?.status?.short !== 'AET' && f.fixture?.status?.short !== 'PEN') continue;

    // جيب الـ match من DB
    const {rows:mRows} = await pool.query(
      "SELECT id FROM matches WHERE provider_ref->>'apiFootball'=$1 LIMIT 1",
      [String(fixId)]
    );
    if (!mRows.length) continue;
    const matchId = mRows[0].id;

    const events = await apiGet('/fixtures/events?fixture='+fixId);
    await delay(200);

    for (const ev of events) {
      const teamId_r = await upsertTeam(ev.team);
      if (!teamId_r) continue;

      // map event type
      const typeMap = {
        'Goal':'GOAL', 'Own Goal':'OWN_GOAL',
        'Yellow Card':'YELLOW', 'Red Card':'RED', 'Yellow Red Card':'SECOND_YELLOW',
        'subst':'SUB_IN', 'Var':'VAR',
        'Penalty':'GOAL',
      };
      const detail = ev.detail||'';
      let evType = typeMap[ev.type] ?? null;
      if (!evType) continue;
      if (ev.type==='Goal' && detail==='Penalty') evType='PENALTY_SCORED';
      if (ev.type==='Goal' && detail==='Missed Penalty') evType='PENALTY_MISSED';
      if (ev.type==='Goal' && detail==='Own Goal') evType='OWN_GOAL';

      const playerId = ev.player?.id ? await upsertPlayer(ev.player) : null;
      const assistId = ev.assist?.id ? await upsertPlayer(ev.assist) : null;

      await pool.query(`
        INSERT INTO match_events (match_id, team_id, player_id, assist_player_id, event_type, minute, minute_extra, detail)
        VALUES ($1,$2,$3,$4,$5::event_type,$6,$7,$8)
        ON CONFLICT DO NOTHING
      `, [matchId, teamId_r, playerId, assistId, evType,
          ev.time?.elapsed||0, ev.time?.extra||0, detail.substring(0,100)]);
      count++;
    }
  }
  return count;
}

async function processStandings(apiId, season, leagueId) {
  const data = await apiGet('/standings?league='+apiId+'&season='+season);
  await delay(250);
  if (!data.length) return 0;

  const standings = data[0]?.league?.standings?.[0] ?? [];
  let count = 0;

  for (const s of standings) {
    const teamId = await upsertTeam(s.team);
    if (!teamId) continue;

    const zone = s.description?.toLowerCase().includes('promot') ? 'PROMOTION'
      : s.description?.toLowerCase().includes('relega') ? 'RELEGATION'
      : s.description?.toLowerCase().includes('champion') ? 'CHAMPIONSHIP'
      : 'NONE';

    await pool.query(`
      INSERT INTO standings (league_id,team_id,season,position,played,wins,draws,losses,goals_for,goals_against,points,form,zone)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::standing_zone)
      ON CONFLICT (league_id,team_id,season) DO UPDATE SET
        position=EXCLUDED.position, played=EXCLUDED.played,
        wins=EXCLUDED.wins, draws=EXCLUDED.draws, losses=EXCLUDED.losses,
        goals_for=EXCLUDED.goals_for, goals_against=EXCLUDED.goals_against,
        points=EXCLUDED.points, form=EXCLUDED.form, zone=EXCLUDED.zone
    `, [leagueId,teamId,String(season),
        s.rank,s.all?.played||0,s.all?.win||0,s.all?.draw||0,s.all?.lose||0,
        s.all?.goals?.for||0,s.all?.goals?.against||0,s.points||0,
        s.form?.slice(-5)||null, zone]);
    count++;
  }
  return count;
}

async function processScorers(apiId, season, leagueId) {
  const data = await apiGet('/players/topscorers?league='+apiId+'&season='+season);
  await delay(250);
  let count = 0;

  for (const item of data.slice(0, 50)) {
    const p = item.player;
    const stats = item.statistics?.[0];
    if (!stats) continue;

    const playerId = await upsertPlayer(p);
    const teamId = await upsertTeam(stats.team);
    if (!playerId||!teamId) continue;

    await pool.query(`
      INSERT INTO season_stats (player_id,team_id,league_id,season,goals,assists,appearances,minutes_played,yellow_cards,red_cards,shots_total,shots_on_target,rating)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (player_id,league_id,season) DO UPDATE SET
        goals=EXCLUDED.goals, assists=EXCLUDED.assists,
        appearances=EXCLUDED.appearances, minutes_played=EXCLUDED.minutes_played,
        yellow_cards=EXCLUDED.yellow_cards, red_cards=EXCLUDED.red_cards,
        shots_total=EXCLUDED.shots_total, shots_on_target=EXCLUDED.shots_on_target,
        rating=EXCLUDED.rating
    `, [playerId,teamId,leagueId,String(season),
        stats.goals?.total||0, stats.goals?.assists||0,
        stats.games?.appearences||0, stats.games?.minutes||0,
        stats.cards?.yellow||0, stats.cards?.red||0,
        stats.shots?.total||0, stats.shots?.on||0,
        stats.games?.rating?parseFloat(stats.games.rating):null]);
    count++;
  }
  return count;
}

async function main() {
  const saved = await loadProgress();
  let startLeague = saved?.league ?? 0;
  let startSeason = saved?.season ?? FROM_YEAR;

  for (let li = startLeague; li < BIG_LEAGUES.length; li++) {
    const league = BIG_LEAGUES[li];
    console.log('\n🏆 ' + league.name);

    const fromSeason = li === startLeague ? startSeason : FROM_YEAR;

    for (let season = fromSeason; season <= TO_YEAR; season++) {
      progress = { league: li, season, phase: 'start' };

      const {rows:lgRows} = await pool.query(
        "SELECT id FROM leagues WHERE provider_ref->>'apiFootball'=$1 AND season=$2 LIMIT 1",
        [String(league.apiId), String(season)]
      );
      if (!lgRows.length) {
        console.log('  ⚠ ' + league.name + ' ' + season + ' not in DB — skipping');
        continue;
      }
      const leagueId = lgRows[0].id;

      try {
        // 1. Fixtures
        progress.phase = 'fixtures';
        const { count: fc, fixtures } = await processFixtures(league.apiId, season, leagueId);

        // 2. Standings
        progress.phase = 'standings';
        const sc = await processStandings(league.apiId, season, leagueId);

        // 3. Top Scorers
        progress.phase = 'scorers';
        const skc = await processScorers(league.apiId, season, leagueId);

        // 4. Events (لكل مباراة)
        progress.phase = 'events';
        const ec = await processEvents(fixtures);

        console.log(`  ✅ ${season}: ${fc} matches | ${sc} standings | ${skc} scorers | ${ec} events | 📊 ${dailyUsed} reqs`);
        await saveProgress();
        await delay(200);

      } catch(e) {
        console.error('  ❌ ' + league.name + ' ' + season + ': ' + e.message);
        await saveProgress();
        await delay(500);
      }
    }
  }

  // حذف ملف التقدم بعد الانتهاء
  const fs = require('fs');
  if (fs.existsSync('/srv/watchkickoff/logs/historical-progress.json')) {
    fs.unlinkSync('/srv/watchkickoff/logs/historical-progress.json');
  }

  console.log('\n✅ ALL DONE! Total API requests: ' + dailyUsed);
  await pool.end();
}

main().catch(async e => {
  console.error('FATAL:', e.message);
  await saveProgress();
  process.exit(1);
});
