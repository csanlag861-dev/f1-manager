export interface DriverStanding {
  driverId: string;
  points: number;
  wins: number;
  podiums: number;
}

export interface ConstructorStanding {
  teamId: string;
  points: number;
  wins: number;
  podiums: number;
}

export interface Season {
  seasonNumber: number; // 1 to 10
  currentRaceIndex: number; // 0 to 23
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
}
