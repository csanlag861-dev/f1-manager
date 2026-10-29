import { describe, it, expect } from 'vitest';
import {
  signYouthDriver,
  releaseYouthDriver,
  calculateTrainingGain,
  trainYouthDriversAnnual,
} from '@/domain/academy/academyManagement';
import { Team, YouthDriver } from '@/domain/models';

function createMockTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 'williams',
    name: 'Williams Racing',
    budget: 60_000_000,
    baseBudget: 60_000_000,
    boardExpectations: { targetConstructorsPosition: 7, description: 'Objetivo zona media' },
    reputation: 75,
    factoryLevel: 2,
    simulatorLevel: 1,
    carId: 'car-williams',
    driverIds: ['albon', 'sainz'],
    chiefEngineerId: 'eng-williams',
    youthDriverIds: [],
    sponsor: {
      id: 'sp-komatsu',
      name: 'Komatsu',
      baseIncomePerRace: 1_200_000,
      bonusTarget: 'points',
      bonusTargetDescription: 'Top 10',
      bonusIncome: 500_000,
      remainingRaces: 24,
    },
    ...overrides,
  };
}

function createMockYouthDriver(overrides: Partial<YouthDriver> = {}): YouthDriver {
  return {
    id: 'youth-1',
    name: 'Joven Talento 1',
    age: 17,
    nationality: 'España',
    pace: 60,
    consistency: 58,
    potential: 90,
    morale: 80,
    teamId: null,
    ...overrides,
  };
}

describe('Tarea 6.2 y 6.3: Gestión de Academia, Límite de 2 Plazas y Entrenamiento Anual (AC-05.2, AC-05.3)', () => {
  it('debe permitir firmar hasta 2 jóvenes promesas y bloquear el fichaje de un 3º piloto (AC-05.2)', () => {
    let team = createMockTeam({ youthDriverIds: [] });
    const youth1 = createMockYouthDriver({ id: 'y-1', name: 'Piloto Uno' });
    const youth2 = createMockYouthDriver({ id: 'y-2', name: 'Piloto Dos' });
    const youth3 = createMockYouthDriver({ id: 'y-3', name: 'Piloto Tres' });

    // 1. Sign 1st youth driver -> success
    const res1 = signYouthDriver(team, youth1);
    expect(res1.success).toBe(true);
    expect(res1.updatedTeam.youthDriverIds).toEqual(['y-1']);
    expect(res1.updatedYouthDriver.teamId).toBe('williams');
    team = res1.updatedTeam;

    // 2. Sign 2nd youth driver -> success
    const res2 = signYouthDriver(team, youth2);
    expect(res2.success).toBe(true);
    expect(res2.updatedTeam.youthDriverIds).toEqual(['y-1', 'y-2']);
    team = res2.updatedTeam;

    // 3. Attempt to sign 3rd youth driver -> blocked by 2-slot limit (AC-05.2)
    const res3 = signYouthDriver(team, youth3);
    expect(res3.success).toBe(false);
    expect(res3.error).toContain('límite máximo de 2 plazas');
    expect(team.youthDriverIds).toHaveLength(2);
  });

  it('debe liberar la plaza ocupada al rescindir o liberar una joven promesa', () => {
    const team = createMockTeam({ youthDriverIds: ['y-1', 'y-2'] });
    const youthList: YouthDriver[] = [
      createMockYouthDriver({ id: 'y-1', teamId: 'williams' }),
      createMockYouthDriver({ id: 'y-2', teamId: 'williams' }),
    ];

    const { updatedTeam, updatedYouthDrivers } = releaseYouthDriver(team, 'y-1', youthList);
    expect(updatedTeam.youthDriverIds).toEqual(['y-2']);
    const released = updatedYouthDrivers.find((y) => y.id === 'y-1')!;
    expect(released.teamId).toBeNull();
  });

  it('debe generar una progresión anual superior con Simulador Nivel 3 frente a Simulador Nivel 1 (AC-05.3)', () => {
    const initialPace = 60;
    const initialConsistency = 58;
    const potential = 92;

    const gainPaceLevel1 = calculateTrainingGain(initialPace, potential, 1);
    const gainPaceLevel3 = calculateTrainingGain(initialPace, potential, 3);
    const gainConsLevel1 = calculateTrainingGain(initialConsistency, potential, 1);
    const gainConsLevel3 = calculateTrainingGain(initialConsistency, potential, 3);

    // Higher simulator level yields strictly higher attribute gain
    expect(gainPaceLevel3).toBeGreaterThan(gainPaceLevel1);
    expect(gainConsLevel3).toBeGreaterThan(gainConsLevel1);

    // Simulation of annual batch
    const teamSim1 = createMockTeam({ id: 'team-sim1', simulatorLevel: 1 });
    const teamSim3 = createMockTeam({ id: 'team-sim3', simulatorLevel: 3 });

    const driverSim1 = createMockYouthDriver({ id: 'd-1', pace: 60, consistency: 58, potential: 92, teamId: 'team-sim1' });
    const driverSim3 = createMockYouthDriver({ id: 'd-3', pace: 60, consistency: 58, potential: 92, teamId: 'team-sim3' });

    const trained = trainYouthDriversAnnual([driverSim1, driverSim3], [teamSim1, teamSim3]);

    const trainedDriver1 = trained.find((d) => d.id === 'd-1')!;
    const trainedDriver3 = trained.find((d) => d.id === 'd-3')!;

    expect(trainedDriver3.pace - initialPace).toBeGreaterThan(trainedDriver1.pace - initialPace);
    expect(trainedDriver3.consistency - initialConsistency).toBeGreaterThan(trainedDriver1.consistency - initialConsistency);
    expect(trainedDriver1.age).toBe(driverSim1.age + 1);
    expect(trainedDriver3.age).toBe(driverSim3.age + 1);
  });
});
