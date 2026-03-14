const { Pool } = require('pg');

const pool = new Pool({ host:'127.0.0.1', user:'postgres', password:'WatchKick2026', database:'watchkickoff' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const delay = ms => new Promise(r => setTimeout(r, ms));

const NATIONALITIES = {
  'Portugal':'PT','Spain':'ES','France':'FR','Germany':'DE','England':'GB',
  'Brazil':'BR','Argentina':'AR','Italy':'IT','Netherlands':'NL','Belgium':'BE',
  'Croatia':'HR','Morocco':'MA','Senegal':'SN','Uruguay':'UY','Colombia':'CO',
  'Saudi Arabia':'SA','Egypt':'EG','Algeria':'DZ','Tunisia':'TN','Nigeria':'NG',
  'Cameroon':'CM','Ghana':'GH','Ivory Coast':'CI','Japan':'JP','Korea Republic':'KR',
  'United States':'US','Mexico':'MX','Denmark':'DK','Sweden':'SE','Norway':'NO',
  'Switzerland':'CH','Austria':'AT','Poland':'PL','Czech Republic':'CZ','Serbia':'RS',
  'Greece':'GR','Turkey':'TR','Ukraine':'UA','Slovakia':'SK','Slovenia':'SI',
  'Hungary':'HU','Romania':'RO','Scotland':'GB','Wales':'GB','Ireland':'IE',
  'Albania':'AL','Kosovo':'XK','Bosnia':'BA','Montenegro':'ME','Finland':'FI',
  'North Macedonia':'MK','Georgia':'GE','Armenia':'AM','Azerbaijan':'AZ',
  'Iran':'IR','Iraq':'IQ','Syria':'SY','Lebanon':'LB','Jordan':'JO',
  'Qatar':'QA','Kuwait':'KW','Bahrain':'BH','United Arab Emirates':'AE',
  'Oman':'OM','Australia':'AU','China':'CN','Indonesia':'ID','Thailand':'TH',
  'South Korea':'KR','Chile':'CL','Peru':'PE','Ecuador':'EC','Paraguay':'PY',
  'Venezuela':'VE','Costa Rica':'CR','Honduras':'HN','Jamaica':'JM',
  'South Africa':'ZA','Zimbabwe':'ZW','Kenya':'KE','Mali':'ML','Guinea':'GN',
  'Burkina Faso':'BF','Angola':'AO','Zambia':'ZM','Uganda':'UG','Benin':'BJ',
  'Iceland':'IS','Luxembourg':'LU','Israel':'IL','Palestine':'PS',
  'Canada':'CA','Russia':'RU','Belarus':'BY','Bulgaria':'BG',
  'Lithuania':'LT','Latvia':'LV','Estonia':'EE','Libya':'LY','Sudan':'SD',
  'Ethiopia':'ET','Tanzania':'TZ','Rwanda':'RW','Mozambique':'MZ',
  'Togo':'TG','Sierra Leone':'SL','Gabon':'GA','Congo DR':'CD','Congo':'CG',
  'Guinea-Bissau':'GW','Cape Verde':'CV','Equatorial Guinea':'GQ','Niger':'NE',
  'Chad':'TD','Mauritania':'MR','Comoros':'KM','Somalia':'SO',
  'Trinidad and Tobago':'TT','Haiti':'HT','Dominican Republic':'DO','Cuba':'CU',
  'Bolivia':'BO','Guatemala':'GT','Panama':'PA','El Salvador':'SV',
  'India':'IN','Pakistan':'PK','Bangladesh':'BD','Sri Lanka':'LK',
  'Myanmar':'MM','Vietnam':'VN','Malaysia':'MY','Philippines':'PH',
  'Kazakhstan':'KZ','Uzbekistan':'UZ','Mongolia':'MN','Cyprus':'CY',
  'Malta':'MT','Moldova':'MD','Tajikistan':'TJ','Turkmenistan':'TM',
  'Kyrgyzstan':'KG','Curacao':'CW','Suriname':'SR','New Zealand':'NZ',
  'Liechtenstein':'LI','Andorra':'AD','San Marino':'SM','Kosovo':'XK',
};

function parseHeight(h) {
  if (!h) return null;
  const n = parseInt(h);
  return isNaN(n) ? null : n;
}

async function fetchPlayer(apiId) {
  const res = await fetch(`https://v3.football.api-sports.io/players?id=${apiId}&season=2025`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  const json = await res.json();
  return json.response?.[0]?.player ?? null;
}

async function main() {
  const { rows } = await pool.query(`
    SELECT id, name, provider_ref
    FROM players
    WHERE (nationality_code IS NULL OR date_of_birth IS NULL OR height_cm IS NULL)
    AND provider_ref IS NOT NULL
    AND provider_ref::text != '{}'
    ORDER BY id
    LIMIT 2000
  `);

  console.log(`Found ${rows.length} players to fix`);
  let fixed = 0, skipped = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const ref = typeof row.provider_ref === 'string'
        ? JSON.parse(row.provider_ref)
        : row.provider_ref;

      const apiId = ref?.apiFootball ?? ref?.['api-football'];
      if (!apiId) { skipped++; continue; }

      const p = await fetchPlayer(apiId);
      if (!p) { skipped++; continue; }

      const nationality = NATIONALITIES[p.nationality] ?? p.nationality?.substring(0,2).toUpperCase() ?? null;
      const dob = p.birth?.date ?? null;
      const height = parseHeight(p.height);
      const foot = (p.parameters?.foot && p.parameters.foot !== 'None') ? p.parameters.foot : null;
      const position = p.position === 'Goalkeeper' ? 'GK'
        : p.position === 'Defender' ? 'DEF'
        : p.position === 'Midfielder' ? 'MID'
        : p.position === 'Attacker' ? 'FWD' : null;

      await pool.query(`
        UPDATE players SET
          nationality_code = COALESCE(nationality_code, $1),
          date_of_birth    = COALESCE(date_of_birth, $2),
          height_cm        = COALESCE(height_cm, $3),
          preferred_foot   = COALESCE(preferred_foot, $4),
          position         = COALESCE(position, $5)
        WHERE id = $6
      `, [nationality, dob, height, foot, position, row.id]);

      fixed++;
      if (i % 50 === 0) console.log(`[${i+1}/${rows.length}] ✅ ${row.name} — ${nationality} / ${height}cm`);
      await delay(300);

    } catch (e) {
      errors++;
      console.error(`❌ ${row.name}: ${e.message}`);
      await delay(300);
    }
  }

  console.log(`\n✅ Done! Fixed: ${fixed} | Skipped: ${skipped} | Errors: ${errors}`);
  await pool.end();
}

main().catch(console.error);
