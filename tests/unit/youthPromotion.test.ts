import { describe, it, expect } from 'vitest';
import { promoteYouthDriver } from '@/domain/academy/academyManagement';
import { Team, Driver, YouthDriver } from '@/domain/models';

function createMockTeamWithVacancy(overrides: Partial<Team> = {}): Team {
  return {
    id: 'alpine',
    name: 'Alpine F1 Team',
    budget: 50_000_000,
    baseBudget: 50_000_000,
    boardExpectations: { targetConstructorsPosition: 6, description: 'Liderar la zona media' },
    reputation: 74,
    factoryLevel: 3,
    simulatorLevel: 2,
    carId: 'car-alpine',
    driverIds: ['gasly', ''], // Seat 2 is vacant!
    chiefEngineerId: 'eng-alpine',
    youthDriverIds: ['young-star-1'],
    sponsor: {
      id: 'sp-bp',
      name: 'Castrol',
      baseIncomePerRace: 1_000_000,
      bonusTarget: 'points',
      bonusTargetDescription: 'Top 10',
      bonusIncome: 400_000,
      remainingRaces: 24,
    },
    ...overrides,
  };
}

describe('Tarea 6.4: Promoción al Asiento Titular (AC-05.4)', () => {
  const currentDrivers: Driver[] = [
    {
      id: 'gasly',
      name: 'Pierre Gasly',
      age: 29,
      nationality: 'Francia',
      pace: 86,
      consistency: 84,
      potential: 87,
      morale: 80,
      salary: 12_000_000,
      contractYears: 2,
      teamId: 'alpine',
    },
  ];

  const youthDriver: YouthDriver = {
    id: 'young-star-1',
    name: 'Julien Laurent',
    age: 18,
    nationality: 'Francia',
    pace: 75,
    consistency: 72,
    potential: 94,
    morale: 85,
    teamId: 'alpine',
  };

  it('debe promover a una joven promesa al asiento vacante convirtiéndolo en titular y liberando su plaza (AC-05.4)', () => {
    const team = createMockTeamWithVacancy();

    const result = promoteYouthDriver(
      team,
      youthDriver,
      2, // Promoting to vacant Seat 2
      currentDrivers,
      [youthDriver],
      2_000_000, // starting salary
      2 // contract years
    );

    expect(result.success).toBe(true);
    expect(result.updatedTeam.driverIds).toEqual(['gasly', 'young-star-1']);
    expect(result.updatedTeam.youthDriverIds).toEqual([]); // Academy slot freed!
    expect(result.newDriver).toBeDefined();
    expect(result.newDriver!.id).toBe('young-star-1');
    expect(result.newDriver!.name).toBe('Julien Laurent');
    expect(result.newDriver!.teamId).toBe('alpine');
    expect(result.newDriver!.salary).toBe(2_000_000);
    expect(result.newDriver!.contractYears).toBe(2);
    expect(result.updatedDrivers).toHaveLength(2);
    expect(result.updatedYouthDrivers).toHaveLength(0);
  });

  it('debe bloquear la promoción si el asiento seleccionado no se encuentra vacante', () => {
    const team = createMockTeamWithVacancy({
      driverIds: ['gasly', 'doohan'], // Both seats occupied
    });

    const result = promoteYouthDriver(
      team,
      youthDriver,
      1, // Trying to promote into occupied Seat 1 (Gasly)
      currentDrivers,
      [youthDriver]
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('no se encuentra vacante');
    expect(team.driverIds[0]).toBe('gasly');
    expect(team.youthDriverIds).toContain('young-star-1');
  });

  it('debe bloquear la promoción si el piloto no pertenece a la academia del equipo', () => {
    const team = createMockTeamWithVacancy();
    const foreignYouth: YouthDriver = {
      ...youthDriver,
      teamId: 'ferrari', // Belongs to another team
    };

    const result = promoteYouthDriver(
      team,
      foreignYouth,
      2,
      currentDrivers,
      [foreignYouth]
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('no pertenece a la academia');
  });
});
