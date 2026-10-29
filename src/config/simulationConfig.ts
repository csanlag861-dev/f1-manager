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

  // Car development & facility parameters (Milestone 4)
  baseUpgradeCost: number;
  baseUpgradeRaces: number;
  upgradeImprovementAmount: number;
  factoryCostDiscountFactor: number;
  engineerCostDiscountFactor: number;
  baseUpgradeSuccessRate: number;
  upgradeMoraleFactor: number;
  facilityUpgradeBaseCost: number;
  maxFacilityLevel: number;

  // FIA points distribution for top 10 finishers
  pointsDistribution: number[];

  // FIA Constructor prize distribution for 10 positions (Milestone 7)
  fiaConstructorPrizeDistribution: number[];

  // Board evaluation & dismissal thresholds (Milestone 7)
  dismissalThresholdPositions: number;
  boardTargetSuccessMinBonus: number;
  boardTargetSuccessMaxBonus: number;
  boardTargetExactBonus: number;
  boardTargetFailureMinPenalty: number;
  boardTargetFailureMaxPenalty: number;
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

  baseUpgradeCost: 5000000,
  baseUpgradeRaces: 4,
  upgradeImprovementAmount: 2,
  factoryCostDiscountFactor: 0.05,
  engineerCostDiscountFactor: 0.20,
  baseUpgradeSuccessRate: 0.20,
  upgradeMoraleFactor: 0.0075,
  facilityUpgradeBaseCost: 10000000,
  maxFacilityLevel: 5,

  mechDnfFactor: 0.08,
  crashDnfFactor: 0.06,
  qualyIncidentFactor: 0.05,

  pointsDistribution: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
  fiaConstructorPrizeDistribution: [
    65000000, 55000000, 48000000, 42000000, 37000000,
    33000000, 29000000, 25000000, 22000000, 19000000,
  ],
  dismissalThresholdPositions: 2,
  boardTargetSuccessMinBonus: 10,
  boardTargetSuccessMaxBonus: 15,
  boardTargetExactBonus: 5,
  boardTargetFailureMinPenalty: 10,
  boardTargetFailureMaxPenalty: 20,
};

