import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:WatchKick2026@localhost:5432/watchkickoff' });

function toSlug(str) {
  return (str || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function main() {
  const { rows } = await pool.query('SELECT id, name, country_code, season FROM leagues ORDER BY id');
  console.log(`Total leagues: ${rows.length}`);
  const usedSlugs = new Map();
  let updated = 0;
  for (const l of rows) {
    const country = (l.country_code || 'ww').toLowerCase().slice(0, 2);
    const season  = (l.season || '').toString().slice(0, 9);
    let base = toSlug(l.name) + '-' + country;
    if (season) base += '-' + season.replace('/', '-');
    if (!base || base.length < 3) base = 'league-' + l.id.slice(0, 8);
    let slug = base;
    let n = 1;
    while (usedSlugs.has(slug)) { n++; slug = base + '-' + n; }
    usedSlugs.set(slug, true);
    try {
      await pool.query('UPDATE leagues SET slug=$1 WHERE id=$2', [slug, l.id]);
      updated++;
      if (updated % 100 === 0) console.log(`Leagues: ${updated}/${rows.length}`);
    } catch(e) {
      console.error(`SKIP ${l.name}: ${e.message}`);
    }
  }
  console.log(`Done: ${updated}/${rows.length}`);
  await pool.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
