import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:WatchKick2026@localhost:5432/watchkickoff' });

async function main() {
  // جيب كل الـ ext_ids المكررة
  const { rows: dups } = await pool.query(`
    SELECT (provider_ref->>'apiFootball') as ext_id, 
           array_agg(id ORDER BY 
             CASE WHEN country_code != 'WW' THEN 0 ELSE 1 END,
             created_at ASC
           ) as ids
    FROM teams
    WHERE provider_ref->>'apiFootball' IS NOT NULL
    GROUP BY ext_id
    HAVING COUNT(*) > 1
  `);
  
  console.log(`Found ${dups.length} duplicate ext_ids`);
  let merged = 0;

  for (const dup of dups) {
    const keepId = dup.ids[0];           // نبقي الأول (أفضل country_code)
    const removeIds = dup.ids.slice(1);  // نحذف الباقيين
    
    try {
      await pool.query('BEGIN');
      
      // تحويل كل الـ references
      for (const oldId of removeIds) {
        await pool.query('UPDATE matches    SET home_team_id = $1 WHERE home_team_id = $2', [keepId, oldId]);
        await pool.query('UPDATE matches    SET away_team_id = $1 WHERE away_team_id = $2', [keepId, oldId]);
        await pool.query('UPDATE standings  SET team_id = $1 WHERE team_id = $2 AND NOT EXISTS (SELECT 1 FROM standings WHERE team_id = $1 AND league_id = standings.league_id)', [keepId, oldId]);
        await pool.query('UPDATE season_stats SET team_id = $1 WHERE team_id = $2', [keepId, oldId]);
        await pool.query('UPDATE players    SET current_team_id = $1 WHERE current_team_id = $2', [keepId, oldId]);
        await pool.query('UPDATE match_lineups SET team_id = $1 WHERE team_id = $2', [keepId, oldId]);
        await pool.query('UPDATE match_events SET team_id = $1 WHERE team_id = $2', [keepId, oldId]);
        
        // حذف الـ standings المكررة بعد التحويل
        await pool.query('DELETE FROM standings WHERE team_id = $1', [oldId]);
        
        // حذف الفريق المكرر
        await pool.query('DELETE FROM teams WHERE id = $1', [oldId]);
      }
      
      await pool.query('COMMIT');
      merged++;
      if (merged % 500 === 0) console.log(`Merged: ${merged}/${dups.length}`);
    } catch(e) {
      await pool.query('ROLLBACK');
      console.error(`SKIP ext_id ${dup.ext_id}: ${e.message}`);
    }
  }
  
  console.log(`Done: merged ${merged}/${dups.length} duplicate teams`);
  
  // تحقق نهائي
  const { rows: check } = await pool.query('SELECT COUNT(*) as total FROM teams');
  console.log(`Teams remaining: ${check[0].total}`);
  
  await pool.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
