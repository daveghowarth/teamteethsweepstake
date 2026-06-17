export function calculateGroupTables(tournament) {
  const tables = {};
  const groups = Array.isArray(tournament.groups) ? tournament.groups : [];
  const teams = Array.isArray(tournament.teams) ? tournament.teams : [];
  const fixtures = Array.isArray(tournament.fixtures) ? tournament.fixtures : [];

  for (const group of groups) {
    tables[group] = teams
      .filter((team) => team.group === group)
      .map((team) => ({
        ...team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      }));
  }

  const completedGroupFixtures = fixtures.filter(
    (fixture) =>
      fixture.stage === "Group" && fixture.homeScore !== null && fixture.awayScore !== null
  );

  // Every completed fixture updates both teams in the relevant group table.
  for (const fixture of completedGroupFixtures) {
    const table = tables[fixture.group];
    if (!table) continue;

    const homeTeam = table.find((team) => team.id === fixture.homeTeamId);
    const awayTeam = table.find((team) => team.id === fixture.awayTeamId);
    if (!homeTeam || !awayTeam) continue;

    applyMatchResult(homeTeam, fixture.homeScore, fixture.awayScore);
    applyMatchResult(awayTeam, fixture.awayScore, fixture.homeScore);
  }

  for (const group of groups) {
    tables[group] = tables[group].sort(sortTableTeams);
  }

  return tables;
}

function applyMatchResult(team, goalsFor, goalsAgainst) {
  if (!team) return;

  team.played += 1;
  team.goalsFor += goalsFor;
  team.goalsAgainst += goalsAgainst;
  team.goalDifference = team.goalsFor - team.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    team.wins += 1;
    team.points += 3;
  } else if (goalsFor === goalsAgainst) {
    team.draws += 1;
    team.points += 1;
  } else {
    team.losses += 1;
  }
}

function sortTableTeams(a, b) {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.name.localeCompare(b.name)
  );
}

export function getQualifiedTeams(groupTables) {
  const automaticQualifiers = Object.values(groupTables).flatMap((table) => table.slice(0, 2));
  const thirdPlacedTeams = Object.values(groupTables)
    .map((table) => table[2])
    .filter(Boolean)
    .sort(sortTableTeams)
    .slice(0, 8);

  // Qualification is only meaningful after teams have actually played.
  return [...automaticQualifiers, ...thirdPlacedTeams].filter((team) => team && team.played > 0);
}

export function calculateDashboardStats(tournament, groupTables, qualifiedTeams) {
  const fixtures = Array.isArray(tournament.fixtures) ? tournament.fixtures : [];
  const completed = fixtures.filter(
    (fixture) => fixture.homeScore !== null && fixture.awayScore !== null
  ).length;

  const leaders = Object.values(groupTables).map((table) => table[0]).filter(Boolean);

  return {
    completed,
    remaining: fixtures.length - completed,
    leaders,
    qualifiedTeams,
    nextFixtures: fixtures
      .filter((fixture) => fixture.homeScore === null || fixture.awayScore === null)
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
      .slice(0, 6),
  };
}

export function getFixturesByStage(fixtures, stageKind) {
  const fixtureList = Array.isArray(fixtures) ? fixtures : [];

  if (stageKind === "group") {
    return fixtureList.filter((fixture) => fixture.stage === "Group");
  }

  return fixtureList.filter((fixture) => fixture.stage !== "Group");
}
