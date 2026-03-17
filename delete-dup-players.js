import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:WatchKick2026@127.0.0.1:5432/watchkickoff' });

async function q(sql, params = []) {
  const c = await pool.connect();
  try { return await c.query(sql, params); } finally { c.release(); }
}

async function main() {
  console.log('Starting players cleanup...');

  // Get all duplicate player IDs
  const { rows: dups } = await q(`
    SELECT p.id FROM players p
    WHERE (p.slug ~ '^player-[0-9]' OR p.slug ~ '-[0-9]+$')
      AND EXISTS (
        SELECT 1 FROM players p2
        WHERE p2.provider_ref->>'apiFootball' = p.provider_ref->>'apiFootball'
          AND NOT (p2.slug ~ '^player-[0-9]' OR p2.slug ~ '-[0-9]+$')
          AND p2.id != p.id
      )
    LIMIT 15000
  `);

  console.log(`Found ${dups.length} duplicate players`);

  const ids = dups.map(r => r.id);
  let deleted = 0;
  const batchSize = 100;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    try {
      // صفّر current_team_id
      await q(`UPDATE players SET current_team_id = NULL WHERE id = ANY($1::uuid[])`, [batch]);
      // احذف
      const r = await q(`DELETE FROM players WHERE id = ANY($1::uuid[])`, [batch]);
      deleted += r.rowCount;
      if (deleted % 1000 === 0) console.log(`Deleted ${deleted}/${ids.length}`);
    } catch(e) {
      console.error(`Batch error: ${e.message}`);
    }
  }

  console.log(`✅ Done! Deleted ${deleted} duplicate players`);
  
  const { rows: [r] } = await q(`SELECT COUNT(*) as total FROM players`);
  console.log(`Total players now: ${r.total}`);
  
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
