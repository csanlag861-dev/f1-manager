import { describe, it, expect } from 'vitest';
import { calculateFacilityUpgradeCost, upgradeFacility } from '../../src/domain/development';
import { Team } from '../../src/domain/models';
import { defaultSimulationConfig } from '../../src/config/simulationConfig';

describe('Tarea 4.5: Ampliación de Nivel de Instalaciones (AC-03.6)', () => {
  const baseTeam: Team = {
    id: 'test-team',
    name: 'Test Team',
    budget: 50000000,
    baseBudget: 50000000,
    boardExpectations: { targetConstructorsPosition: 5, description: 'Top 5' },
    reputation: 80,
    factoryLevel: 2,
    simulatorLevel: 3,
    carId: 'car-1',
    driverIds: ['d1', 'd2'],
    chiefEngineerId: 'eng-1',
    youthDriverIds: [],
    sponsor: {
      id: 'sp1',
      name: 'Sponsor',
      baseIncomePerRace: 1000000,
      bonusTarget: 'top_10',
      bonusTargetDescription: 'Top 10',
      bonusIncome: 500000,
      remainingRaces: 24,
    },
  };

  it('debe aumentar el nivel de Fábrica en 1 y descontar el coste de la obra inmediatamente', () => {
    const cost = calculateFacilityUpgradeCost('factory', baseTeam.factoryLevel);
    const result = upgradeFacility(baseTeam, 'factory');

    expect(result.success).toBe(true);
    expect(result.newLevel).toBe(3); // 2 -> 3
    expect(result.updatedTeam.factoryLevel).toBe(3);
    expect(result.updatedTeam.budget).toBe(baseTeam.budget - cost);
  });

  it('debe aumentar el nivel de Simulador en 1 y descontar el coste', () => {
    const cost = calculateFacilityUpgradeCost('simulator', baseTeam.simulatorLevel);
    const result = upgradeFacility(baseTeam, 'simulator');

    expect(result.success).toBe(true);
    expect(result.newLevel).toBe(4); // 3 -> 4
    expect(result.updatedTeam.simulatorLevel).toBe(4);
    expect(result.updatedTeam.budget).toBe(baseTeam.budget - cost);
  });

  it('debe bloquear la ampliación si la instalación ya alcanzó el nivel máximo (Nivel 5)', () => {
    const maxedTeam = { ...baseTeam, factoryLevel: 5 };
    const result = upgradeFacility(maxedTeam, 'factory');

    expect(result.success).toBe(false);
    expect(result.error).toContain('nivel máximo permitido');
    expect(result.updatedTeam.factoryLevel).toBe(5);
    expect(result.updatedTeam.budget).toBe(baseTeam.budget);
  });

  it('debe rechazar la ampliación si el presupuesto es insuficiente', () => {
    const poorTeam = { ...baseTeam, budget: 1000 };
    const result = upgradeFacility(poorTeam, 'factory');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Presupuesto insuficiente');
    expect(result.updatedTeam.factoryLevel).toBe(2);
    expect(result.updatedTeam.budget).toBe(1000);
  });
});
