import {
  findTeamBySlug, findTeamOverview, findTeamFixtures,
  findTeamSquad, findTeamStandings, findTeamStats, findTeamTransfers,
} from './teams.queries.js';

export async function getTeamBySlug(slug: string) {
  return findTeamBySlug(slug);
}
export async function getTeamOverview(teamId: string) {
  return findTeamOverview(teamId);
}
export async function getTeamFixtures(teamId: string) {
  return findTeamFixtures(teamId, 'upcoming');
}
export async function getTeamResults(teamId: string) {
  return findTeamFixtures(teamId, 'results');
}
export async function getTeamSquad(teamId: string) {
  return findTeamSquad(teamId);
}
export async function getTeamStandings(teamId: string, season: string = '2025') {
  return findTeamStandings(teamId, season);
}
export async function getTeamStats(teamId: string, season: string = '2025') {
  return findTeamStats(teamId, season);
}
export async function getTeamTransfers(teamId: string) {
  return findTeamTransfers(teamId);
}
