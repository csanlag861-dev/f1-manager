import { describe, it, expect } from 'vitest';
import { calculateFixedExpenses } from '@/domain/economy/finances';
import { Team, Driver, ChiefEngineer } from '@/domain/models';
import { defaultSimulationConfig } from '@/config/simulationConfig';

describe('Tarea 3.2: Deducción de Salarios y Mantenimiento Operativo (AC-02.3)', () => {
  const team: Team = {
    id: 'mercedes',
    name: 'Mercedes-AMG',
    budget: 80000000,
    baseBudget: 80000000,
    boardExpectations: { targetConstructorsPosition: 3, description: 'Top 3' },
    reputation: 92,
    factoryLevel: 4,
    simulatorLevel: 3,
    carId: 'car-mercedes',
    driverIds: ['russell', 'antonelli'],
    chiefEngineerId: 'eng-mercedes',
    youthDriverIds: [],
    sponsor: {
      id: 'sp-petronas',
      name: 'Petronas',
      baseIncomePerRace: 2300000,
      bonusTarget: 'top_10',
      bonusTargetDescription: 'Top 10',
      bonusIncome: 1100000,
      remainingRaces: 24,
    },
  };

  const drivers: Driver[] = [
    { id: 'russell', name: 'Russell', age: 27, nationality: 'GB', pace: 91, consistency: 88, potential: 93, morale: 84, salary: 24000000, contractYears: 2, teamId: 'mercedes' },
    { id: 'antonelli', name: 'Antonelli', age: 18, nationality: 'IT', pace: 84, consistency: 80, potential: 95, morale: 80, salary: 4800000, contractYears: 3, teamId: 'mercedes' },
  ];

  const engineer: ChiefEngineer = {
    id: 'eng-mercedes',
    name: 'James Allison',
    developmentEfficiency: 93,
    setupPerformance: 91,
    morale: 87,
    salary: 7200000,
    contractYears: 2,
    teamId: 'mercedes',
  };

  it('debe calcular el prorrateo exacto por GP de los salarios anuales (/24)', () => {
    // Total annual salaries = 24M + 4.8M + 7.2M = 36,000,000
    // Prorated per GP = 36,000,000 / 24 = 1,500,000
    const expenses = calculateFixedExpenses(team, drivers, engineer, defaultSimulationConfig);

    expect(expenses.salariesCost).toBe(1500000);
  });

  it('debe calcular el coste de mantenimiento operativo según el nivel de Fábrica y Simulador', () => {
    // Factory: Level 4 * 250,000 = 1,000,000
    // Simulator: Level 3 * 150,000 = 450,000
    // Total maintenance = 1,450,000
    const expenses = calculateFixedExpenses(team, drivers, engineer, defaultSimulationConfig);

    expect(expenses.maintenanceCost).toBe(1450000);
  });

  it('debe totalizar la suma exacta de gastos fijos por Gran Premio', () => {
    // Total expenses = 1,500,000 (salaries) + 1,450,000 (maintenance) = 2,950,000
    const expenses = calculateFixedExpenses(team, drivers, engineer, defaultSimulationConfig);

    expect(expenses.totalExpenses).toBe(2950000);
  });
});
