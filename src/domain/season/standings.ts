import { DriverStanding, ConstructorStanding, RaceResultEntry, Season } from '../models';

export function sortDriverStandings(standings: DriverStanding[]): DriverStanding[] {
  return [...standings].sort((a, b) => {
    // 1st criterion: Points
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2nd criterion: Wins
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    // 3rd criterion: Podiums
    if (b.podiums !== a.podiums) {
      return b.podiums - a.podiums;
    }
    return a.driverId.localeCompare(b.driverId);
  });
}

export function sortConstructorStandings(standings: ConstructorStanding[]): ConstructorStanding[] {
  return [...standings].sort((a, b) => {
    // 1st criterion: Points
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2nd criterion: Wins
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    // 3rd criterion: Podiums
    if (b.podiums !== a.podiums) {
      return b.podiums - a.podiums;
    }
    return a.teamId.localeCompare(b.teamId);
  });
}

export function updateSeasonStandings(season: Season, raceResults: RaceResultEntry[]): Season {
  // 1. Update Drivers
  const driverStandingsMap = new Map(season.driverStandings.map((s) => [s.driverId, { ...s }]));

  for (const entry of raceResults) {
    if (entry.isDnf) continue; // DNFs get 0 points

    let standing = driverStandingsMap.get(entry.driverId);
    if (!standing) {
      standing = { driverId: entry.driverId, points: 0, wins: 0, podiums: 0 };
      driverStandingsMap.set(entry.driverId, standing);
    }

    standing.points += entry.points;
    if (entry.finishPosition === 1) standing.wins += 1;
    if (entry.finishPosition <= 3) standing.podiums += 1;
  }

  // 2. Update Constructors
  const constructorStandingsMap = new Map(season.constructorStandings.map((s) => [s.teamId, { ...s }]));

  for (const entry of raceResults) {
    if (!entry.teamId || entry.isDnf) continue;

    let cStanding = constructorStandingsMap.get(entry.teamId);
    if (!cStanding) {
      cStanding = { teamId: entry.teamId, points: 0, wins: 0, podiums: 0 };
      constructorStandingsMap.set(entry.teamId, cStanding);
    }

    cStanding.points += entry.points;
    if (entry.finishPosition === 1) cStanding.wins += 1;
    if (entry.finishPosition <= 3) cStanding.podiums += 1;
  }

  const updatedDriverStandings = sortDriverStandings(Array.from(driverStandingsMap.values()));
  const updatedConstructorStandings = sortConstructorStandings(Array.from(constructorStandingsMap.values()));

  return {
    ...season,
    driverStandings: updatedDriverStandings,
    constructorStandings: updatedConstructorStandings,
  };
}
