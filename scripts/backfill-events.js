const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiGet(path) {
  const res = await fetch(`https://v3.football.api-sports.io${path}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  const d = await res.json();
  return d.response ?? [];
}

function mapEventType(type, detail) {
  const t = type?.toLowerCase();
  const d = detail ?? '';
  if (t === 'goal') {
    if (d.includes('Missed Penalty')) return 'PENALTY_MISSED';
    if (d.includes('Penalty')) return 'PENALTY_SCORED';
    if (d.includes('Own Goal')) return 'OWN_GOAL';
    return 'GOAL';
  }
  if (t === 'card') {
    if (d.includes('Second Yellow')) return 'SECOND_YELLOW';
    if (d.includes('Red')) return 'RED';
    return 'YELLOW';
  }
  if (t === 'subst') return 'SUB_IN';
  if (t === 'var') return 'VAR';
  return 'VAR';
}

async function main() {
  console.log('🚀 Backfill Events for finished matches');

  // Get matches finished in last 30 days with no events
  const { rows: matches } = await pool.query(`
    SELECT m.id, m.slug, provider_ref->>'apiFootball' as ext_id,
           m.home_team_id, m.away_team_id
    FROM matches m
    WHERE m.status = 'FINISHED'
    AND m.kickoff_at > NOW() - INTERVAL '30 days'
    AND NOT EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id)
    ORDER BY m.kickoff_at DESC
  `);

  console.log(`Found ${matches.length} matches without events`);
  let done = 0;

  for (const match of matches) {
    try {
      const events = await apiGet(`/fixtures/events?fixture=${match.ext_id}`);
      await sleep(300);

      if (!events.length) { done++; continue; }

      for (const ev of events) {
        const extTeamId = String(ev.team.id);
        const extPlayerId = ev.player?.id ? String(ev.player.id) : null;

        const teamRow = await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball' = $1`, [extTeamId]);
        const teamId = teamRow.rows[0]?.id;
        if (!teamId) continue;

        let playerId = null;
        if (extPlayerId) {
          const playerRow = await pool.query(`SELECT id FROM players WHERE provider_ref->>'apiFootball' = $1`, [extPlayerId]);
          playerId = playerRow.rows[0]?.id ?? null;
        }

        const eventType = mapEventType(ev.type, ev.detail);
        const meta = JSON.stringify({ playerName: ev.player?.name ?? null, assistName: ev.assist?.name ?? null });

        await pool.query(`
          INSERT INTO match_events (id, match_id, team_id, player_id, event_type, minute, minute_extra, detail, meta)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8::jsonb)
          ON CONFLICT DO NOTHING
        `, [match.id, teamId, playerId, eventType, ev.time?.elapsed ?? null, ev.time?.extra ?? 0, ev.detail ?? null, meta]);
      }
      done++;
      process.stdout.write(`\r  ${done}/${matches.length} matches processed`);
    } catch(e) {
      console.error(`\nERR match ${match.ext_id}:`, e.message);
    }
  }

  console.log(`\n🏁 Done: ${done} matches backfilled`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
