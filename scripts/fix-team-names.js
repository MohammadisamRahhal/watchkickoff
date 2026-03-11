
const { Pool } = require('pg');
const pool = new Pool({ host:'127.0.0.1', database:'watchkickoff', user:'postgres', password:'WatchKick2026' });
const API_KEY = 'd8a653353374e0d1b32c7afb3adf30b2';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function main() {
  const { rows } = await pool.query("SELECT id, provider_ref->>'apiFootball' as ext_id FROM teams WHERE name ~ '^[0-9]+$'");
  console.log('Found ' + rows.length + ' teams with numeric names');
  let fixed = 0;
  for (const team of rows) {
    try {
      const res = await fetch('https://v3.football.api-sports.io/teams?id=' + team.ext_id, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const data = await res.json();
      const t = data.response?.[0];
      if (!t) { console.log('No data for ' + team.ext_id); continue; }
      const name = t.team.name;
      const crest = t.team.logo;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await pool.query('UPDATE teams SET name=$1, crest_url=$2, slug=$3 WHERE id=$4', [name, crest, slug, team.id]);
      fixed++;
      process.stdout.write('\r  ' + fixed + '/' + rows.length + ' fixed — last: ' + name);
      await sleep(300);
    } catch(e) {
      console.error('ERR ' + team.ext_id + ': ' + e.message);
    }
  }
  console.log('\nDone: ' + fixed + ' teams fixed');
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
