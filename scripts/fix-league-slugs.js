const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });

function toSlug(str) {
  return str.toLowerCase()
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
    .replace(/[ùúûü]/g,'u').replace(/[ñ]/g,'n')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

async function main() {
  const { rows } = await pool.query(`SELECT id, name, season, slug, country_code FROM leagues ORDER BY name, country_code`);
  console.log('Leagues to update:', rows.length);

  // اعرف الأسماء المكررة
  const nameCounts = {};
  for (const r of rows) {
    const key = `${toSlug(r.name)}-${r.season}`;
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  }

  let updated = 0; let errors = 0;
  const usedSlugs = new Set();

  // جيب الـ slugs الحالية عشان نتجنب conflict
  const { rows: existing } = await pool.query(`SELECT slug FROM leagues`);
  existing.forEach(r => usedSlugs.add(r.slug));

  for (const row of rows) {
    const baseName = toSlug(row.name);
    const baseSlug = `${baseName}-${row.season}`;
    const isDuplicate = nameCounts[baseSlug] > 1;
    
    // الدوريات المكررة تاخذ كود الدولة
    let newSlug = isDuplicate 
      ? `${baseName}-${(row.country_code||'ww').toLowerCase()}-${row.season}`
      : baseSlug;

    // إذا لسا مكرر نضيف رقم
    let counter = 2;
    const originalSlug = newSlug;
    while (usedSlugs.has(newSlug) && newSlug !== row.slug) {
      newSlug = `${originalSlug}-${counter++}`;
    }

    if (newSlug === row.slug) { usedSlugs.add(newSlug); updated++; continue; }

    usedSlugs.delete(row.slug);
    usedSlugs.add(newSlug);

    try {
      await pool.query(`UPDATE leagues SET slug=$1, updated_at=NOW() WHERE id=$2`, [newSlug, row.id]);
      updated++;
    } catch(e) {
      console.log('ERR', row.name, row.country_code, ':', e.message);
      errors++;
    }
  }

  console.log('Updated:', updated, '| Errors:', errors);

  const { rows: samples } = await pool.query(`
    SELECT slug, name, country_code FROM leagues 
    WHERE name IN ('Premier League','La Liga','UEFA Champions League','Bundesliga','Serie A','Ligue 1','Saudi Professional League')
    ORDER BY name, country_code LIMIT 15`);
  console.log('\nSamples:');
  samples.forEach(r => console.log(' ', r.slug, '←', r.name, r.country_code));

  await pool.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
