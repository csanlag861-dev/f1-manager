import { describe, it, expect } from 'vitest';
import { getFinancialOverview } from '@/domain/economy/finances';
import { Team, Driver, ChiefEngineer } from '@/domain/models';
import { defaultSimulationConfig } from '@/config/simulationConfig';

describe('Tarea 3.5: Cálculo del Panel de Control Financiero (AC-02.1)', () => {
  const dummyTeam: Team = {
    id: 'test-team',
    name: 'Test Racing',
    baseBudget: 40_000_000,
    budget: 35_000_000,
    boardExpectations: {
      targetConstructorsPosition: 5,
      description: 'Luchar por los puntos',
    },
    reputation: 75,
    driverIds: ['d1', 'd2'],
    chiefEngineerId: 'eng-1',
    carId: 'car-1',
    youthDriverIds: [],
    factoryLevel: 2,
    simulatorLevel: 1,
    sponsor: {
      id: 'sp-1',
      name: 'Apex Global',
      baseIncomePerRace: 2_000_000,
      bonusTarget: 'top_10',
      bonusTargetDescription: 'Al menos un monoplaza en el Top 10',
      bonusIncome: 500_000,
      remainingRaces: 24,
    },
  };

  const dummyDrivers: Driver[] = [
    {
      id: 'd1',
      name: 'Driver One',
      teamId: 'test-team',
      salary: 12_000_000, // 500,000 / GP
      pace: 80,
      consistency: 80,
      potential: 85,
      morale: 85,
      contractYears: 2,
      nationality: 'Española',
      age: 26,
    },
    {
      id: 'd2',
      name: 'Driver Two',
      teamId: 'test-team',
      salary: 6_000_000, // 250,000 / GP
      pace: 75,
      consistency: 78,
      potential: 80,
      morale: 80,
      contractYears: 1,
      nationality: 'Británica',
      age: 23,
    },
  ];

  const dummyEngineer: ChiefEngineer = {
    id: 'eng-1',
    name: 'Chief One',
    teamId: 'test-team',
    salary: 2_400_000, // 100,000 / GP
    developmentEfficiency: 80,
    setupPerformance: 80,
    morale: 85,
    contractYears: 2,
  };

  it('calcula el resumen financiero para una escudería solvente con desglose preciso', () => {
    const overview = getFinancialOverview(dummyTeam, dummyDrivers, dummyEngineer, defaultSimulationConfig);

    // Budget & Debt
    expect(overview.currentBudget).toBe(35_000_000);
    expect(overview.baseBudget).toBe(40_000_000);
    expect(overview.currentDebt).toBe(0);
    expect(overview.maxAllowedDebt).toBe(10_000_000); // 40M * 0.25
    expect(overview.remainingDebtMargin).toBe(10_000_000);
    expect(overview.debtUsagePercentage).toBe(0);
    expect(overview.isBankrupt).toBe(false);

    // Projected Income
    expect(overview.projectedIncome.sponsorName).toBe('Apex Global');
    expect(overview.projectedIncome.baseIncome).toBe(2_000_000);
    expect(overview.projectedIncome.bonusIncome).toBe(500_000);
    expect(overview.projectedIncome.maxPotentialIncome).toBe(2_500_000);

    // Fixed Expenses
    // Drivers: (12M + 6M) / 24 = 750,000
    expect(overview.fixedExpenses.driversSalariesCost).toBe(750_000);
    // Engineer: 2.4M / 24 = 100,000
    expect(overview.fixedExpenses.engineerSalaryCost).toBe(100_000);
    expect(overview.fixedExpenses.totalSalariesCost).toBe(850_000);

    // Maintenance: 2 * 250k (factory) + 1 * 150k (simulator) = 650,000
    expect(overview.fixedExpenses.factoryMaintenanceCost).toBe(500_000);
    expect(overview.fixedExpenses.simulatorMaintenanceCost).toBe(150_000);
    expect(overview.fixedExpenses.totalMaintenanceCost).toBe(650_000);

    // Total expenses: 850k + 650k = 1,500,000
    expect(overview.fixedExpenses.totalFixedExpenses).toBe(1_500_000);

    // Projected Net
    // Guaranteed: 2M - 1.5M = +500,000
    expect(overview.projectedNet.guaranteed).toBe(500_000);
    // Potential: 2.5M - 1.5M = +1,000,000
    expect(overview.projectedNet.potentialWithBonus).toBe(1_000_000);
  });

  it('calcula correctamente el margen de deuda y el porcentaje de endeudamiento con saldo negativo', () => {
    const indebtedTeam: Team = {
      ...dummyTeam,
      budget: -4_000_000, // 4M debt
    };

    const overview = getFinancialOverview(indebtedTeam, dummyDrivers, dummyEngineer, defaultSimulationConfig);

    expect(overview.currentBudget).toBe(-4_000_000);
    expect(overview.currentDebt).toBe(4_000_000);
    expect(overview.maxAllowedDebt).toBe(10_000_000);
    expect(overview.remainingDebtMargin).toBe(6_000_000); // 10M - 4M
    expect(overview.debtUsagePercentage).toBe(40); // 4M / 10M = 40%
    expect(overview.isBankrupt).toBe(false);
  });

  it('maneja con seguridad el caso de ingeniero ausente (undefined)', () => {
    const overview = getFinancialOverview(dummyTeam, dummyDrivers, undefined, defaultSimulationConfig);

    expect(overview.fixedExpenses.engineerSalaryCost).toBe(0);
    expect(overview.fixedExpenses.totalSalariesCost).toBe(750_000);
    expect(overview.fixedExpenses.totalFixedExpenses).toBe(750_000 + 650_000);
  });
});
