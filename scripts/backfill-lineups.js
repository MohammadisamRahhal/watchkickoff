
const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const TOP_LEAGUES = [39,140,135,78,61,2,3,848,45,48,531,307,103,283,179,203,88,94,235,197,71,73];
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function apiGet(path) {
  const res = await fetch('https://v3.football.api-sports.io' + path, { headers: { 'x-apisports-key': API_KEY } });
  const d = await res.json();
  return d.response ?? [];
}
async function main() {
  console.log('Backfill Lineups TOP_LEAGUES last 1 year');
  const { rows: matches } = await pool.query(`
    SELECT m.id, m.provider_ref->>'apiFootball' as ext_id
    FROM matches m JOIN leagues l ON l.id = m.league_id
    WHERE m.status = 'FINISHED'
    AND m.kickoff_at > NOW() - INTERVAL '1 year'
    AND (l.provider_ref->>'apiFootball')::int = ANY(\$1::int[])
    AND NOT EXISTS (SELECT 1 FROM match_lineups WHERE match_id = m.id)
    ORDER BY m.kickoff_at DESC
  `, [TOP_LEAGUES]);
  console.log('Found ' + matches.length + ' matches without lineups');
  let done = 0;
  for (const match of matches) {
    try {
      const lineups = await apiGet('/fixtures/lineups?fixture=' + match.ext_id);
      await sleep(300);
      if (!lineups.length) { done++; continue; }
      for (const lineup of lineups) {
        const extTeamId = String(lineup.team.id);
        const teamRow = await pool.query("SELECT id FROM teams WHERE provider_ref->>'apiFootball' = \$1", [extTeamId]);
        const teamId = teamRow.rows[0]?.id;
        if (!teamId) continue;
        const players = [
          ...(lineup.startXI || []).map(s => ({ ...s.player, is_starter: true })),
          ...(lineup.substitutes || []).map(s => ({ ...s.player, is_starter: false }))
        ];
        for (const p of players) {
          const pr = await pool.query("SELECT id FROM players WHERE provider_ref->>'apiFootball' = \$1", [String(p.id)]);
          const playerId = pr.rows[0]?.id;
          if (!playerId) continue;
          const slot = p.grid ? parseInt(p.grid.split(':')[0]) : null;
          await pool.query(
            'INSERT INTO match_lineups (id,match_id,team_id,player_id,shirt_number,position_code,is_starter,formation_slot,is_captain,created_at) VALUES (gen_random_uuid(),\$1,\$2,\$3,\$4,\$5,\$6,\$7,\$8,NOW()) ON CONFLICT DO NOTHING',
            [match.id, teamId, playerId, p.number ?? null, p.pos ?? null, p.is_starter, slot, p.captain ?? false]
          );
        }
      }
      done++;
      process.stdout.write('\r  ' + done + '/' + matches.length + ' matches processed');
    } catch(e) {
      console.error('\nERR ' + match.ext_id + ': ' + e.message);
      done++;
    }
  }
  console.log('\nDone: ' + done + ' matches backfilled');
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
