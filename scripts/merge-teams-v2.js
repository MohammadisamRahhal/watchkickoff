const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });

async function main() {
  console.log('Finding duplicate teams...');
  const { rows: dupes } = await pool.query(`
    SELECT 
      provider_ref->>'apiFootball' as ext_id,
      array_agg(id ORDER BY created_at) as ids
    FROM teams
    WHERE provider_ref->>'apiFootball' IS NOT NULL
    GROUP BY provider_ref->>'apiFootball'
    HAVING COUNT(*) > 1
  `);
  console.log('Duplicates found: ' + dupes.length);

  let merged = 0; let errors = 0;

  for (const dupe of dupes) {
    const keepId = dupe.ids[0];
    const removeIds = dupe.ids.slice(1);
    try {
      // 1. احذف match_events للمباريات المكررة أولاً
      await pool.query(`DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE (home_team_id=ANY($1) OR away_team_id=ANY($1)) AND provider_ref->>'apiFootball' IN (SELECT provider_ref->>'apiFootball' FROM matches WHERE home_team_id=$2 OR away_team_id=$2))`, [removeIds, keepId]);
      // 2. احذف match_lineups للمباريات المكررة
      await pool.query(`DELETE FROM match_lineups WHERE match_id IN (SELECT id FROM matches WHERE (home_team_id=ANY($1) OR away_team_id=ANY($1)) AND provider_ref->>'apiFootball' IN (SELECT provider_ref->>'apiFootball' FROM matches WHERE home_team_id=$2 OR away_team_id=$2))`, [removeIds, keepId]);
      // 3. احذف المباريات المكررة
      await pool.query(`DELETE FROM matches WHERE (home_team_id=ANY($1) OR away_team_id=ANY($1)) AND provider_ref->>'apiFootball' IN (SELECT provider_ref->>'apiFootball' FROM matches WHERE home_team_id=$2 OR away_team_id=$2)`, [removeIds, keepId]);
      // 4. حول المباريات المتبقية
      await pool.query(`UPDATE matches SET home_team_id=$1 WHERE home_team_id=ANY($2)`, [keepId, removeIds]);
      await pool.query(`UPDATE matches SET away_team_id=$1 WHERE away_team_id=ANY($2)`, [keepId, removeIds]);
      // 5. حول match_events وlineups المتبقية
      await pool.query(`UPDATE match_events SET team_id=$1 WHERE team_id=ANY($2)`, [keepId, removeIds]);
      await pool.query(`UPDATE match_lineups SET team_id=$1 WHERE team_id=ANY($2)`, [keepId, removeIds]);
      // 6. standings وseason_stats — احذف المكرر فقط
      await pool.query(`DELETE FROM standings WHERE team_id=ANY($1)`, [removeIds]);
      await pool.query(`DELETE FROM season_stats WHERE team_id=ANY($1)`, [removeIds]);
      // 7. players
      await pool.query(`UPDATE players SET current_team_id=$1 WHERE current_team_id=ANY($2)`, [keepId, removeIds]);
      // 8. احذف الفرق الزيادة
      await pool.query(`DELETE FROM teams WHERE id=ANY($1)`, [removeIds]);
      merged++;
      if (merged % 100 === 0) console.log('Merged: ' + merged + '/' + dupes.length);
    } catch(e) {
      console.log('ERR ' + dupe.ext_id + ': ' + e.message);
      errors++;
    }
  }

  console.log('Done! Merged: ' + merged + ' | Errors: ' + errors);
  const { rows: t } = await pool.query('SELECT COUNT(*) as total FROM teams');
  const { rows: m } = await pool.query('SELECT COUNT(*) as total FROM matches');
  console.log('Teams: ' + t[0].total + ' | Matches: ' + m[0].total);
  await pool.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
