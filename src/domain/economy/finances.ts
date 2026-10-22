import { Team, Driver, ChiefEngineer, Car, RaceResultEntry, RaceFinancials } from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';

export interface SponsorSettlement {
  baseIncome: number;
  bonusIncome: number;
  bonusAchieved: boolean;
  totalIncome: number;
}

export interface FixedExpensesSettlement {
  salariesCost: number;
  maintenanceCost: number;
  totalExpenses: number;
}

export interface FinancialSettlementResult {
  sponsor: SponsorSettlement;
  expenses: FixedExpensesSettlement;
  dnfRepairCost: number;
  netIncome: number;
  previousBudget: number;
  newBudget: number;
  currentDebt: number;
  maxAllowedDebt: number;
  isBankrupt: boolean;
}

/**
 * Evaluates sponsor contract income (base guaranteed + performance bonus).
 * Satisfies AC-02.2.
 */
export function calculateSponsorIncome(
  team: Team,
  raceResults: RaceResultEntry[]
): SponsorSettlement {
  const baseIncome = team.sponsor.baseIncomePerRace;
  const driverIds: string[] = [team.driverIds[0], team.driverIds[1]];
  const teamFinishes = raceResults.filter((r) => driverIds.includes(r.driverId));

  let bonusAchieved = false;

  if (teamFinishes.length > 0) {
    const target = team.sponsor.bonusTarget;
    const classifiedFinishes = teamFinishes.filter((r) => !r.isDnf);

    if (target === 'podium') {
      bonusAchieved = classifiedFinishes.some((r) => r.finishPosition <= 3);
    } else if (target === 'top_10') {
      bonusAchieved = classifiedFinishes.some((r) => r.finishPosition <= 10);
    } else if (target === 'both_top_10') {
      bonusAchieved =
        classifiedFinishes.length === 2 &&
        classifiedFinishes.every((r) => r.finishPosition <= 10);
    } else {
      // Default: top 10 if unknown
      bonusAchieved = classifiedFinishes.some((r) => r.finishPosition <= 10);
    }
  }

  const bonusIncome = bonusAchieved ? team.sponsor.bonusIncome : 0;
  const totalIncome = baseIncome + bonusIncome;

  return {
    baseIncome,
    bonusIncome,
    bonusAchieved,
    totalIncome,
  };
}

/**
 * Calculates operational fixed costs per GP (prorated annual salaries + facility maintenance).
 * Satisfies AC-02.3.
 */
export function calculateFixedExpenses(
  team: Team,
  drivers: Driver[],
  engineer: ChiefEngineer | undefined,
  config: SimulationConfig = defaultSimulationConfig
): FixedExpensesSettlement {
  // Prorated salaries: Sum of annual salaries / 24
  const teamDriverIds: string[] = [team.driverIds[0], team.driverIds[1]];
  const teamDrivers = drivers.filter((d) => teamDriverIds.includes(d.id));

  const totalAnnualSalaries =
    teamDrivers.reduce((sum, d) => sum + d.salary, 0) + (engineer?.salary ?? 0);
  const salariesCost = Math.round(totalAnnualSalaries / 24);

  // Maintenance: factory + simulator levels
  const maintenanceCost =
    team.factoryLevel * config.factoryMaintenanceCostPerLevel +
    team.simulatorLevel * config.simulatorMaintenanceCostPerLevel;

  return {
    salariesCost,
    maintenanceCost,
    totalExpenses: salariesCost + maintenanceCost,
  };
}

/**
 * Calculates proportional DNF repair penalty based on car attribute development level.
 * Formula: Cost = BaseRepairCost * (1 + k_upgrade * CarAttributeLevel)
 * Satisfies AC-06.5.
 */
export function calculateDnfRepairCost(
  car: Car,
  dnfCount: number,
  config: SimulationConfig = defaultSimulationConfig
): number {
  if (dnfCount <= 0) return 0;

  const avgAttributes = (car.topSpeed + car.downforce + car.reliability) / 3;
  const unitRepairCost = Math.round(
    config.baseDnfRepairCost * (1 + config.dnfRepairCostFactor * avgAttributes)
  );

  return unitRepairCost * dnfCount;
}

/**
 * Checks whether current debt exceeds the maximum debt threshold (% of baseBudget).
 * Satisfies AC-02.4.
 */
export function checkBankruptcy(
  currentBudget: number,
  baseBudget: number,
  config: SimulationConfig = defaultSimulationConfig
): { isBankrupt: boolean; currentDebt: number; maxAllowedDebt: number } {
  const currentDebt = currentBudget < 0 ? Math.abs(currentBudget) : 0;
  const maxAllowedDebt = Math.round(baseBudget * config.maxDebtPercentage);
  const isBankrupt = currentDebt > maxAllowedDebt;

  return { isBankrupt, currentDebt, maxAllowedDebt };
}

/**
 * Executes full financial settlement for a race weekend.
 */
export function calculateRaceFinancialSettlement(
  team: Team,
  car: Car,
  drivers: Driver[],
  engineer: ChiefEngineer | undefined,
  raceResults: RaceResultEntry[],
  config: SimulationConfig = defaultSimulationConfig
): FinancialSettlementResult {
  const sponsor = calculateSponsorIncome(team, raceResults);
  const expenses = calculateFixedExpenses(team, drivers, engineer, config);

  const teamDriverIds: string[] = [team.driverIds[0], team.driverIds[1]];
  const playerDnfs = raceResults.filter(
    (r) => teamDriverIds.includes(r.driverId) && r.isDnf
  ).length;

  const dnfRepairCost = calculateDnfRepairCost(car, playerDnfs, config);
  const netIncome = sponsor.totalIncome - expenses.totalExpenses - dnfRepairCost;
  const previousBudget = team.budget;
  const newBudget = previousBudget + netIncome;

  const { isBankrupt, currentDebt, maxAllowedDebt } = checkBankruptcy(
    newBudget,
    team.baseBudget,
    config
  );

  return {
    sponsor,
    expenses,
    dnfRepairCost,
    netIncome,
    previousBudget,
    newBudget,
    currentDebt,
    maxAllowedDebt,
    isBankrupt,
  };
}

export interface FinancialOverview {
  currentBudget: number;
  baseBudget: number;
  currentDebt: number;
  maxAllowedDebt: number;
  remainingDebtMargin: number;
  debtUsagePercentage: number;
  isBankrupt: boolean;
  projectedIncome: {
    sponsorName: string;
    baseIncome: number;
    bonusIncome: number;
    bonusTargetDescription: string;
    maxPotentialIncome: number;
  };
  fixedExpenses: {
    driversSalariesCost: number;
    engineerSalaryCost: number;
    totalSalariesCost: number;
    factoryMaintenanceCost: number;
    simulatorMaintenanceCost: number;
    totalMaintenanceCost: number;
    totalFixedExpenses: number;
  };
  projectedNet: {
    guaranteed: number;
    potentialWithBonus: number;
  };
}

/**
 * Calculates current financial health, projected income, fixed expense breakdown,
 * and remaining debt margin before bankruptcy for the dashboard financial control panel.
 * Satisfies AC-02.1.
 */
export function getFinancialOverview(
  team: Team,
  drivers: Driver[],
  engineer: ChiefEngineer | undefined,
  config: SimulationConfig = defaultSimulationConfig
): FinancialOverview {
  const teamDriverIds: string[] = [team.driverIds[0], team.driverIds[1]];
  const teamDrivers = drivers.filter((d) => teamDriverIds.includes(d.id));

  const driversAnnualSalary = teamDrivers.reduce((sum, d) => sum + d.salary, 0);
  const engineerAnnualSalary = engineer?.salary ?? 0;
  const driversSalariesCost = Math.round(driversAnnualSalary / 24);
  const engineerSalaryCost = Math.round(engineerAnnualSalary / 24);
  const totalSalariesCost = driversSalariesCost + engineerSalaryCost;

  const factoryMaintenanceCost = team.factoryLevel * config.factoryMaintenanceCostPerLevel;
  const simulatorMaintenanceCost = team.simulatorLevel * config.simulatorMaintenanceCostPerLevel;
  const totalMaintenanceCost = factoryMaintenanceCost + simulatorMaintenanceCost;
  const totalFixedExpenses = totalSalariesCost + totalMaintenanceCost;

  const baseIncome = team.sponsor.baseIncomePerRace;
  const bonusIncome = team.sponsor.bonusIncome;
  const maxPotentialIncome = baseIncome + bonusIncome;

  const bankruptcy = checkBankruptcy(team.budget, team.baseBudget, config);
  const remainingDebtMargin = Math.max(0, bankruptcy.maxAllowedDebt - bankruptcy.currentDebt);
  const debtUsagePercentage =
    bankruptcy.maxAllowedDebt > 0
      ? Math.min(100, Math.round((bankruptcy.currentDebt / bankruptcy.maxAllowedDebt) * 100))
      : 0;

  return {
    currentBudget: team.budget,
    baseBudget: team.baseBudget,
    currentDebt: bankruptcy.currentDebt,
    maxAllowedDebt: bankruptcy.maxAllowedDebt,
    remainingDebtMargin,
    debtUsagePercentage,
    isBankrupt: bankruptcy.isBankrupt,
    projectedIncome: {
      sponsorName: team.sponsor.name,
      baseIncome,
      bonusIncome,
      bonusTargetDescription: team.sponsor.bonusTargetDescription,
      maxPotentialIncome,
    },
    fixedExpenses: {
      driversSalariesCost,
      engineerSalaryCost,
      totalSalariesCost,
      factoryMaintenanceCost,
      simulatorMaintenanceCost,
      totalMaintenanceCost,
      totalFixedExpenses,
    },
    projectedNet: {
      guaranteed: baseIncome - totalFixedExpenses,
      potentialWithBonus: maxPotentialIncome - totalFixedExpenses,
    },
  };
}

