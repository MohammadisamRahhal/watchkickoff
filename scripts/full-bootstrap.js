
const { Client } = require('/srv/watchkickoff/node_modules/pg');
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const SEASON = 2025;
const DELAY = 350;
const client = new Client({ connectionString: 'postgresql://postgres:WatchKick2026@127.0.0.1/watchkickoff' });

async function apiGet(path) {
  const res = await fetch(`https://v3.football.api-sports.io${path}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  const data = await res.json();
  return data.response ?? [];
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function mapStatus(s) {
  const m = {'NS':'SCHEDULED','TBD':'SCHEDULED','1H':'LIVE','HT':'LIVE','2H':'LIVE','ET':'LIVE','P':'LIVE','BT':'LIVE','FT':'FINISHED','AET':'FINISHED','PEN':'FINISHED','PST':'POSTPONED','CANC':'CANCELLED','ABD':'CANCELLED'};
  return m[s] ?? 'SCHEDULED';
}

async function step1_leagues() {
  console.log('\n=== STEP 1: Leagues ===');
  const leagues = await apiGet(`/leagues?season=${SEASON}&current=true`);
  let n = 0;
  for (const item of leagues) {
    const l = item.league, c = item.country;
    await client.query(`INSERT INTO leagues (id,name,slug,country_code,season,type,coverage_level,provider_ref,is_active,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,1,$6::jsonb,true,NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,is_active=true,updated_at=NOW()`,
      [l.name, `league-${l.id}-${SEASON}`, (c.code||'WW').slice(0,2).toUpperCase(), SEASON, l.type.toUpperCase(), JSON.stringify({apiFootball:String(l.id),logo:l.logo})]);
    n++;
  }
  console.log(`Leagues: ${n}`);
  return leagues.map(l => ({extId: String(l.league.id), name: l.league.name}));
}

async function step2_teams(leagues) {
  console.log('\n=== STEP 2: Teams ===');
  let total = 0, failed = 0;
  for (const league of leagues) {
    try {
      const teams = await apiGet(`/teams?league=${league.extId}&season=${SEASON}`);
      for (const item of teams) {
        const t = item.team;
        const slug = `team-${t.id}-${t.name.toLowerCase().replace(/[^a-z0-9]/g,'-').slice(0,40)}`;
        await client.query(`INSERT INTO teams (id,name,slug,country_code,crest_url,provider_ref,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5::jsonb,NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,crest_url=EXCLUDED.crest_url,updated_at=NOW()`,
          [t.name, slug, (t.country||'WW').slice(0,2).toUpperCase(), t.logo, JSON.stringify({apiFootball:String(t.id)})]);
        total++;
      }
      await sleep(DELAY);
    } catch(e) { failed++; }
    if (total % 500 === 0 && total > 0) console.log(`  Teams so far: ${total}`);
  }
  console.log(`Teams: ${total} upserted, ${failed} failed`);
}

async function step3_fixtures(leagues) {
  console.log('\n=== STEP 3: Fixtures ===');
  let total = 0, failed = 0;
  for (const league of leagues) {
    try {
      const fixtures = await apiGet(`/fixtures?league=${league.extId}&season=${SEASON}`);
      const lgRes = await client.query("SELECT id FROM leagues WHERE slug=$1", [`league-${league.extId}-${SEASON}`]);
      if (!lgRes.rows[0]) { await sleep(DELAY); continue; }
      const lgId = lgRes.rows[0].id;
      for (const fx of fixtures) {
        const homeId = String(fx.teams.home.id), awayId = String(fx.teams.away.id);
        const hRes = await client.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1", [homeId]);
        const aRes = await client.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1", [awayId]);
        if (!hRes.rows[0] || !aRes.rows[0]) continue;
        await client.query(`INSERT INTO matches (id,slug,league_id,home_team_id,away_team_id,kickoff_at,status,home_score,away_score,home_score_ht,away_score_ht,season,round,venue,raw_status,provider_ref,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET status=$6,home_score=$7,away_score=$8,raw_status=$14,updated_at=NOW()`,
          [`match-${fx.fixture.id}`, lgId, hRes.rows[0].id, aRes.rows[0].id, new Date(fx.fixture.date), mapStatus(fx.fixture.status.short), fx.goals.home??0, fx.goals.away??0, fx.score.halftime.home??0, fx.score.halftime.away??0, String(SEASON), fx.league.round, fx.fixture.venue?.name, fx.fixture.status.short, JSON.stringify({apiFootball:String(fx.fixture.id)})]);
        total++;
      }
      if (fixtures.length > 0) console.log(`  ${league.name}: ${fixtures.length}`);
      await sleep(DELAY);
    } catch(e) { failed++; console.log(`  FAIL ${league.name}: ${e.message}`); }
  }
  console.log(`Fixtures: ${total} upserted, ${failed} failed`);
}

async function step4_standings(leagues) {
  console.log('\n=== STEP 4: Standings ===');
  let total = 0, failed = 0;
  for (const league of leagues) {
    try {
      const data = await apiGet(`/standings?league=${league.extId}&season=${SEASON}`);
      if (!data[0]?.league?.standings) { await sleep(DELAY); continue; }
      const lgRes = await client.query("SELECT id FROM leagues WHERE slug=$1", [`league-${league.extId}-${SEASON}`]);
      if (!lgRes.rows[0]) { await sleep(DELAY); continue; }
      for (const group of data[0].league.standings) {
        for (const row of group) {
          const tRes = await client.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball'=$1 LIMIT 1", [String(row.team.id)]);
          if (!tRes.rows[0]) continue;
          await client.query(`INSERT INTO standings (id,league_id,team_id,season,points,played,won,drawn,lost,goals_for,goals_against,goal_diff,position,form,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW()) ON CONFLICT (league_id,team_id,season) DO UPDATE SET points=$4,played=$5,won=$6,drawn=$7,lost=$8,goals_for=$9,goals_against=$10,goal_diff=$11,position=$12,form=$13,updated_at=NOW()`,
            [lgRes.rows[0].id, tRes.rows[0].id, SEASON, row.points, row.all.played, row.all.win, row.all.draw, row.all.lose, row.all.goals.for, row.all.goals.against, row.goalsDiff, row.rank, row.form]);
          total++;
        }
      }
      await sleep(DELAY);
    } catch(e) { failed++; }
  }
  console.log(`Standings: ${total} upserted, ${failed} failed`);
}

async function step5_scorers(leagues) {
  console.log('\n=== STEP 5: Scorers ===');
  let total = 0, failed = 0;
  for (const league of leagues) {
    try {
      const data = await apiGet(`/players/topscorers?league=${league.extId}&season=${SEASON}`);
      const lgRes = await client.query("SELECT id FROM leagues WHERE slug=$1", [`league-${league.extId}-${SEASON}`]);
      if (!lgRes.rows[0]) { await sleep(DELAY); continue; }
      for (const item of data) {
        const p = item.player, st = item.statistics[0];
        if (!st) continue;
        const pSlug = `player-${p.id}-${p.name.toLowerCase().replace(/[^a-z0-9]/g,'-').slice(0,40)}`;
        await client.query(`INSERT INTO players (id,name,slug,nationality,position,provider_ref,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5::jsonb,NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,updated_at=NOW()`,
          [p.name, pSlug, p.nationality, st.games.position, JSON.stringify({apiFootball:String(p.id)})]);
        const pRes = await client.query("SELECT id FROM players WHERE slug=$1", [pSlug]);
        if (!pRes.rows[0]) continue;
        await client.query(`INSERT INTO season_stats (id,player_id,league_id,season,goals,assists,appearances,minutes,yellow_cards,red_cards,rating,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) ON CONFLICT (player_id,league_id,season) DO UPDATE SET goals=$4,assists=$5,appearances=$6,minutes=$7,yellow_cards=$8,red_cards=$9,rating=$10,updated_at=NOW()`,
          [pRes.rows[0].id, lgRes.rows[0].id, SEASON, st.goals.total??0, st.goals.assists??0, st.games.appearences??0, st.games.minutes??0, st.cards.yellow??0, st.cards.red??0, st.games.rating?parseFloat(st.games.rating):null]);
        total++;
      }
      await sleep(DELAY);
    } catch(e) { failed++; }
  }
  console.log(`Scorers: ${total} upserted, ${failed} failed`);
}

async function main() {
  await client.connect();
  console.log('🚀 Full Bootstrap - Season', SEASON);
  const leagues = await step1_leagues();
  await step2_teams(leagues);
  await step3_fixtures(leagues);
  await step4_standings(leagues);
  await step5_scorers(leagues);
  const s = await client.query("SELECT (SELECT COUNT(*) FROM leagues) as leagues,(SELECT COUNT(*) FROM teams) as teams,(SELECT COUNT(*) FROM matches) as matches,(SELECT COUNT(*) FROM standings) as standings,(SELECT COUNT(*) FROM season_stats) as scorers");
  console.log('\n=== SUMMARY ===', s.rows[0]);
  await client.end();
  console.log('✅ Done!');
}
main().catch(e => { console.error('FATAL:', e); process.exit(1); });
