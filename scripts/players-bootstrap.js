const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });

const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
const SEASON = 2025;
const TOP_LEAGUES = [39,40,41,42,78,135,140,61,2,3,253,94,88,71,136];

async function apiGet(path) {
  const res = await fetch(`https://v3.football.api-sports.io${path}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  const d = await res.json();
  return d.response ?? [];
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🚀 Players Bootstrap');
  let total = 0;

  for (const leagueId of TOP_LEAGUES) {
    const teams = await apiGet(`/teams?league=${leagueId}&season=${SEASON}`);
    await sleep(350);

    for (const t of teams) {
      const extId = String(t.team.id);
      const tr = await pool.query(`SELECT id FROM teams WHERE provider_ref->>'apiFootball' = $1`, [extId]);
      if (!tr.rows[0]) continue;
      const teamId = tr.rows[0].id;

      let page = 1;
      while (true) {
        const players = await apiGet(`/players?team=${extId}&season=${SEASON}&page=${page}`);
        await sleep(350);
        if (!players.length) break;

        for (const item of players) {
          const p = item.player;
          const slug = `player-${p.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30)}`;
          try {
            await pool.query(`
              INSERT INTO players (id,name,slug,nationality_code,date_of_birth,position,current_team_id,provider_ref,created_at,updated_at)
              VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7::jsonb,NOW(),NOW())
              ON CONFLICT (slug) DO UPDATE SET current_team_id=$6, updated_at=NOW()
            `, [p.name, slug, p.nationality?.slice(0,2)?.toUpperCase(), p.birth?.date||null, p.position||null, teamId, JSON.stringify({apiFootball:extId})]);
            total++;
          } catch(e) { console.error('ERR:', e.message); }
        }

        if (players.length < 20) break;
        page++;
      }
      process.stdout.write(`\r  ${t.team.name}: ${total} total`);
    }
    console.log(`\n✅ League ${leagueId} done`);
  }

  console.log(`\n🏁 Total: ${total} players`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
