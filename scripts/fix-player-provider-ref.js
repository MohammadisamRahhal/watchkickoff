const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const SEASON = 2025;
const TOP_LEAGUES = [39,40,41,42,78,135,140,61,2,3,253,94,88,71,136];

const NATIONALITY_MAP = {
  'Afghanistan':'AF','Albania':'AL','Algeria':'DZ','Argentina':'AR','Armenia':'AM',
  'Australia':'AU','Austria':'AT','Azerbaijan':'AZ','Bahrain':'BH','Belgium':'BE',
  'Bolivia':'BO','Bosnia':'BA','Brazil':'BR','Bulgaria':'BG','Cameroon':'CM',
  'Canada':'CA','Chile':'CL','China':'CN','Colombia':'CO','Congo':'CG',
  'Costa Rica':'CR','Croatia':'HR','Czech Republic':'CZ','Denmark':'DK',
  'Ecuador':'EC','Egypt':'EG','England':'GB','Estonia':'EE','Ethiopia':'ET',
  'Finland':'FI','France':'FR','Gabon':'GA','Georgia':'GE','Germany':'DE',
  'Ghana':'GH','Greece':'GR','Guinea':'GN','Honduras':'HN','Hungary':'HU',
  'Iceland':'IS','India':'IN','Indonesia':'ID','Iran':'IR','Iraq':'IQ',
  'Ireland':'IE','Israel':'IL','Italy':'IT','Ivory Coast':'CI','Jamaica':'JM',
  'Japan':'JP','Jordan':'JO','Kazakhstan':'KZ','Kenya':'KE','Kosovo':'XK',
  'Latvia':'LV','Lebanon':'LB','Libya':'LY','Lithuania':'LT','Luxembourg':'LU',
  'Mali':'ML','Malta':'MT','Mexico':'MX','Moldova':'MD','Montenegro':'ME',
  'Morocco':'MA','Mozambique':'MZ','Netherlands':'NL','New Zealand':'NZ',
  'Nigeria':'NG','North Macedonia':'MK','Northern Ireland':'GB','Norway':'NO',
  'Palestine':'PS','Panama':'PA','Paraguay':'PY','Peru':'PE','Poland':'PL',
  'Portugal':'PT','Romania':'RO','Russia':'RU','Saudi Arabia':'SA','Scotland':'GB',
  'Senegal':'SN','Serbia':'RS','Sierra Leone':'SL','Slovakia':'SK','Slovenia':'SI',
  'Somalia':'SO','South Korea':'KR','Spain':'ES','Sudan':'SD','Sweden':'SE',
  'Switzerland':'CH','Syria':'SY','Togo':'TG','Trinidad and Tobago':'TT',
  'Tunisia':'TN','Turkey':'TR','Uganda':'UG','Ukraine':'UA','United States':'US',
  'Uruguay':'UY','Venezuela':'VE','Wales':'GB','Zambia':'ZM','Zimbabwe':'ZW',
  'DR Congo':'CD','Cape Verde':'CV','Guinea-Bissau':'GW','Equatorial Guinea':'GQ',
  'Burkina Faso':'BF','Benin':'BJ','Niger':'NE','Tanzania':'TZ','Angola':'AO',
  'Namibia':'NA','Sweden':'SE','Finland':'FI',
};

function mapPosition(pos) {
  if (!pos) return null;
  const p = pos.toLowerCase();
  if (p.includes('goalkeeper')) return 'GK';
  if (p.includes('defender')) return 'DEF';
  if (p.includes('midfielder')) return 'MID';
  if (p.includes('attacker') || p.includes('forward')) return 'FWD';
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiGet(path) {
  const res = await fetch(`https://v3.football.api-sports.io${path}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  const d = await res.json();
  return d.response ?? [];
}

async function main() {
  console.log('🚀 Fix player provider_ref (team_id → player_id)');
  let fixed = 0;

  for (const leagueId of TOP_LEAGUES) {
    const teams = await apiGet(`/teams?league=${leagueId}&season=${SEASON}`);
    await sleep(350);

    for (const t of teams) {
      const extTeamId = String(t.team.id);
      const tr = await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball' = $1`, [extTeamId]);
      if (!tr.rows[0]) continue;
      const teamId = tr.rows[0].id;

      let page = 1;
      while (true) {
        const players = await apiGet(`/players?team=${extTeamId}&season=${SEASON}&page=${page}`);
        await sleep(350);
        if (!players.length) break;

        for (const item of players) {
          const p = item.player;
          const extPlayerId = String(p.id);
          const position = mapPosition(item.statistics?.[0]?.games?.position);
          const natCode = NATIONALITY_MAP[p.nationality] || p.nationality?.slice(0,2)?.toUpperCase() || null;
          const slug = `player-${p.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30)}`;

          // Upsert by slug — fix provider_ref, position, nationality
          await pool.query(`
            INSERT INTO players (id, name, slug, nationality_code, date_of_birth, position, current_team_id, provider_ref, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW())
            ON CONFLICT (slug) DO UPDATE SET
              provider_ref = $7::jsonb,
              nationality_code = $3,
              position = $5,
              current_team_id = $6,
              updated_at = NOW()
          `, [p.name, slug, natCode, p.birth?.date || null, position, teamId, JSON.stringify({apiFootball: extPlayerId})]);
          fixed++;
        }

        if (players.length < 20) break;
        page++;
      }
      process.stdout.write(`\r  League ${leagueId} / Team ${extTeamId}: ${fixed} fixed`);
    }
    console.log(`\n✅ League ${leagueId} done`);
  }

  console.log(`\n🏁 Done: ${fixed} players fixed`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
