export interface SimulationConfig {
  qualyCarWeight: number;
  qualyDriverWeight: number;
  qualySetupWeight: number;

  raceGridWeight: number;
  raceCarWeight: number;
  raceDriverWeight: number;
  raceSetupWeight: number;

  qualyRandomSigma: number;
  raceRandomSigma: number;

  maxDebtPercentage: number;
  dnfRepairCostFactor: number;

  maxConcurrentUpgrades: number;
  maxYouthDrivers: number;
  maxCareerSeasons: number;

  moraleRaceDelta: number;
  upgradeFailMoralePenalty: number;
  retryUpgradeDiscount: number;

  baseDnfRepairCost: number;
  factoryMaintenanceCostPerLevel: number;
  simulatorMaintenanceCostPerLevel: number;

  mechDnfFactor: number;
  crashDnfFactor: number;
  qualyIncidentFactor: number;

  // FIA points distribution for top 10 finishers
  pointsDistribution: number[];
}

export const defaultSimulationConfig: SimulationConfig = {
  qualyCarWeight: 0.50,
  qualyDriverWeight: 0.40,
  qualySetupWeight: 0.10,

  raceGridWeight: 0.35,
  raceCarWeight: 0.35,
  raceDriverWeight: 0.20,
  raceSetupWeight: 0.10,

  qualyRandomSigma: 0.05,
  raceRandomSigma: 0.07,

  maxDebtPercentage: 0.25,
  dnfRepairCostFactor: 0.03,
  baseDnfRepairCost: 500000,
  factoryMaintenanceCostPerLevel: 250000,
  simulatorMaintenanceCostPerLevel: 150000,

  maxConcurrentUpgrades: 2,
  maxYouthDrivers: 2,
  maxCareerSeasons: 10,

  moraleRaceDelta: 5,
  upgradeFailMoralePenalty: 3,
  retryUpgradeDiscount: 0.50,

  mechDnfFactor: 0.08,
  crashDnfFactor: 0.06,
  qualyIncidentFactor: 0.05,

  pointsDistribution: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
};
