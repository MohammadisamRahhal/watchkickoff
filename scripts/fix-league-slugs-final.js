const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });

function toSlug(name) {
  return name.toLowerCase()
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
    .replace(/[ùúûü]/g,'u').replace(/[ñ]/g,'n')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

async function main() {
  const { rows } = await pool.query(`SELECT id, name, season, slug, country_code FROM leagues ORDER BY name, country_code`);
  console.log('Leagues:', rows.length);

  // اعرف الأسماء المكررة
  const nameCounts = {};
  for (const r of rows) {
    const key = toSlug(r.name);
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  }

  let updated = 0; let errors = 0;
  const usedSlugs = new Set();

  for (const row of rows) {
    const baseName = toSlug(row.name);
    const season = parseInt(row.season);
    const seasonStr = `${season-1}-${season}`;
    const isDuplicate = nameCounts[baseName] > 1;

    let newSlug = isDuplicate
      ? `${baseName}-${(row.country_code||'ww').toLowerCase()}-${seasonStr}`
      : `${baseName}-${seasonStr}`;

    // تجنب التكرار
    let counter = 2;
    const orig = newSlug;
    while (usedSlugs.has(newSlug) && newSlug !== row.slug) {
      newSlug = `${orig}-${counter++}`;
    }

    usedSlugs.add(newSlug);
    if (newSlug === row.slug) { updated++; continue; }

    try {
      await pool.query(`UPDATE leagues SET slug=$1, updated_at=NOW() WHERE id=$2`, [newSlug, row.id]);
      updated++;
    } catch(e) {
      console.log('ERR', row.name, row.country_code, ':', e.message);
      errors++;
    }
  }

  console.log('Updated:', updated, '| Errors:', errors);

  const { rows: s } = await pool.query(`
    SELECT slug, name FROM leagues 
    WHERE provider_ref->>'apiFootball' IN ('39','78','135','61','2','3','307')
    ORDER BY name`);
  console.log('\nTop leagues:');
  s.forEach(r => console.log(' ', r.slug, '←', r.name));

  await pool.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
