import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:WatchKick2026@localhost:5432/watchkickoff' });

function toSlug(str) {
  return (str || '').toLowerCase()
    .replace(/[أإآا]/g, 'a').replace(/[ب]/g, 'b').replace(/[ت]/g, 't')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function main() {
  // Load ALL existing slugs into memory first
  const { rows: existing } = await pool.query('SELECT slug FROM teams');
  const usedSlugs = new Map();
  for (const r of existing) usedSlugs.set(r.slug, true);

  // Only fix teams with old-style slugs
  const { rows } = await pool.query("SELECT id, name, country_code, slug FROM teams WHERE slug LIKE 'team-%' ORDER BY id");
  console.log(`Found ${rows.length} teams to fix`);

  let updated = 0;
  for (const t of rows) {
    // Remove old slug from map so we can reuse the slot
    usedSlugs.delete(t.slug);

    const country = (t.country_code || 'ww').toLowerCase().slice(0, 2);
    let base = toSlug(t.name) + '-' + country;
    if (!base || base === '-ww' || base === '-') base = 'team-' + t.id.slice(0, 8);
    let slug = base;
    let n = 1;
    while (usedSlugs.has(slug)) { n++; slug = base + '-' + n; }
    usedSlugs.set(slug, true);

    try {
      await pool.query('UPDATE teams SET slug=$1 WHERE id=$2', [slug, t.id]);
      updated++;
      if (updated % 100 === 0) console.log(`Teams: ${updated}/${rows.length}`);
    } catch (e) {
      console.error(`SKIP ${t.name}: ${e.message}`);
    }
  }
  console.log(`Done: ${updated}/${rows.length}`);
  await pool.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
