const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const SEASON = 2025;
const TOP_LEAGUES = [39,40,41,42,78,135,140,61,2,3,253,94,88,71,136];

// ISO country name → code map
const NATIONALITY_MAP = {
  'Afghanistan':'AF','Albania':'AL','Algeria':'DZ','Argentina':'AR','Armenia':'AM',
  'Australia':'AU','Austria':'AT','Azerbaijan':'AZ','Bahrain':'BH','Bangladesh':'BD',
  'Belgium':'BE','Bolivia':'BO','Bosnia':'BA','Brazil':'BR','Bulgaria':'BG',
  'Cameroon':'CM','Canada':'CA','Chile':'CL','China':'CN','Colombia':'CO',
  'Congo':'CG','Costa Rica':'CR','Croatia':'HR','Czech Republic':'CZ','Denmark':'DK',
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
  'Tunisia':'TN','Turkey':'TR','Uganda':'UG','Ukraine':'UA',
  'United States':'US','Uruguay':'UY','Venezuela':'VE','Wales':'GB',
  'Zambia':'ZM','Zimbabwe':'ZW','DR Congo':'CD','Cape Verde':'CV',
  'Guinea-Bissau':'GW','Equatorial Guinea':'GQ','Burkina Faso':'BF',
  'Benin':'BJ','Niger':'NE','Tanzania':'TZ','Angola':'AO','Namibia':'NA',
};

// position string → enum value
function mapPosition(pos) {
  if (!pos) return null;
  const p = pos.toLowerCase();
  if (p.includes('goalkeeper') || p === 'g') return 'GK';
  if (p.includes('defender') || p === 'd') return 'DEF';
  if (p.includes('midfielder') || p === 'm') return 'MID';
  if (p.includes('attacker') || p.includes('forward') || p === 'f') return 'FWD';
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
  console.log('🚀 Fix Players Position + Nationality');
  let updated = 0;

  for (const leagueId of TOP_LEAGUES) {
    const teams = await apiGet(`/teams?league=${leagueId}&season=${SEASON}`);
    await sleep(350);

    for (const t of teams) {
      const extId = String(t.team.id);
      let page = 1;

      while (true) {
        const players = await apiGet(`/players?team=${extId}&season=${SEASON}&page=${page}`);
        await sleep(350);
        if (!players.length) break;

        for (const item of players) {
          const p = item.player;
          const extPlayerId = String(p.id);
          const position = mapPosition(item.statistics?.[0]?.games?.position);
          const natCode = NATIONALITY_MAP[p.nationality] || p.nationality?.slice(0,2)?.toUpperCase() || null;

          await pool.query(`
            UPDATE players 
            SET position = $1, nationality_code = $2, updated_at = NOW()
            WHERE provider_ref->>'apiFootball' = $3
          `, [position, natCode, extPlayerId]);
          updated++;
        }

        if (players.length < 20) break;
        page++;
      }
      process.stdout.write(`\r  League ${leagueId} / Team ${extId}: ${updated} updated`);
    }
    console.log(`\n✅ League ${leagueId} done`);
  }

  console.log(`\n🏁 Done: ${updated} players processed`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
