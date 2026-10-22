export interface SponsorContract {
  id: string;
  name: string;
  baseIncomePerRace: number;
  bonusTarget: string; // e.g., 'top_10', 'podium', 'both_top_10'
  bonusTargetDescription: string;
  bonusIncome: number;
  remainingRaces: number;
}

export interface BoardExpectations {
  targetConstructorsPosition: number; // e.g., 1 for Red Bull, 5 for Aston Martin, 10 for Haas
  description: string;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  baseBudget: number;
  boardExpectations: BoardExpectations;
  reputation: number; // 1-100
  factoryLevel: number; // 1-5
  simulatorLevel: number; // 1-5
  carId: string;
  driverIds: [string, string];
  chiefEngineerId: string;
  youthDriverIds: string[];
  sponsor: SponsorContract;
}
