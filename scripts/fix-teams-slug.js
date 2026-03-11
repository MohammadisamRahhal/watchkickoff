const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });

function toSlug(str) {
  return str.toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n').replace(/[ç]/g, 'c').replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function fixTeams() {
  console.log('=== FIXING TEAMS ===');
  const { rows } = await pool.query('SELECT id, name, country_code FROM teams ORDER BY id');
  const usedSlugs = new Map();
  let updated = 0;
  for (const t of rows) {
    const country = (t.country_code || 'ww').toLowerCase().slice(0,2);
    let base = toSlug(t.name) + '-' + country;
    if (!base || base === '-') base = 'team-' + country;
    let slug = base;
    let n = 1;
    while (usedSlugs.has(slug)) { n++; slug = base + '-' + n; }
    usedSlugs.set(slug, true);
    await pool.query('UPDATE teams SET slug=$1 WHERE id=$2', [slug, t.id]);
    updated++;
    if (updated % 1000 === 0) console.log('Teams: ' + updated + '/' + rows.length);
  }
  console.log('Teams done: ' + updated);
}

async function fixMatches() {
  console.log('=== FIXING MATCHES ===');
  const { rows } = await pool.query(`
    SELECT m.id, m.kickoff_at, ht.name as home_name, at.name as away_name
    FROM matches m
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    ORDER BY m.id
  `);
  const usedSlugs = new Map();
  let updated = 0;
  for (const m of rows) {
    const date = new Date(m.kickoff_at).toISOString().slice(0,10);
    let base = toSlug(m.home_name) + '-vs-' + toSlug(m.away_name) + '-' + date;
    let slug = base;
    let n = 1;
    while (usedSlugs.has(slug)) { n++; slug = base + '-' + n; }
    usedSlugs.set(slug, true);
    await pool.query('UPDATE matches SET slug=$1 WHERE id=$2', [slug, m.id]);
    updated++;
    if (updated % 5000 === 0) console.log('Matches: ' + updated + '/' + rows.length);
  }
  console.log('Matches done: ' + updated);
}

async function main() {
  console.log('=== RESUMING FROM TEAMS ===');
  await fixTeams();
  await fixMatches();
  console.log('=== ALL DONE ===');
  await pool.end();
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
