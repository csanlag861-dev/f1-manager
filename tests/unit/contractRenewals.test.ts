import { describe, it, expect } from 'vitest';
import { canRenewContract, renewContract, processContractExpirations } from '../../src/domain/market';
import { Driver, ChiefEngineer, Team } from '../../src/domain/models';

describe('Tarea 5.3: Renovación de Contratos y Pase a Agencia Libre (AC-04.3, AC-04.4)', () => {
  const driverWith2Years: Driver = {
    id: 'd-2years',
    name: 'Driver Secure',
    age: 26,
    nationality: 'España',
    pace: 88,
    consistency: 85,
    potential: 90,
    morale: 80,
    salary: 10_000_000,
    contractYears: 2,
    teamId: 'team-1',
  };

  const driverWith1Year: Driver = {
    id: 'd-1year',
    name: 'Driver Expiring',
    age: 29,
    nationality: 'Francia',
    pace: 86,
    consistency: 84,
    potential: 87,
    morale: 78,
    salary: 8_000_000,
    contractYears: 1,
    teamId: 'team-1',
  };

  const engineerWith1Year: ChiefEngineer = {
    id: 'eng-1year',
    name: 'Chief Engineer 1Y',
    developmentEfficiency: 85,
    setupPerformance: 83,
    morale: 80,
    salary: 3_000_000,
    contractYears: 1,
    teamId: 'team-1',
  };

  const team: Team = {
    id: 'team-1',
    name: 'Team 1',
    budget: 50_000_000,
    baseBudget: 50_000_000,
    boardExpectations: { targetConstructorsPosition: 4, description: 'Top 4' },
    reputation: 82,
    factoryLevel: 3,
    simulatorLevel: 3,
    carId: 'car-1',
    driverIds: ['d-2years', 'd-1year'],
    chiefEngineerId: 'eng-1year',
    youthDriverIds: [],
    sponsor: {
      id: 'sp1',
      name: 'Sponsor',
      baseIncomePerRace: 1500000,
      bonusTarget: 'top_10',
      bonusTargetDescription: 'Top 10',
      bonusIncome: 800000,
      remainingRaces: 24,
    },
  };

  it('debe bloquear la renovación si el empleado tiene más de 1 año de contrato restante (AC-04.3)', () => {
    const check = canRenewContract(driverWith2Years);
    expect(check.canRenew).toBe(false);
    expect(check.reason).toContain('solo puede renovarse con 1 año o menos');

    const result = renewContract(driverWith2Years, 2);
    expect(result.success).toBe(false);
  });

  it('debe permitir la renovación para empleados con 1 año restante extendiendo duración y pactando salario', () => {
    const check = canRenewContract(driverWith1Year);
    expect(check.canRenew).toBe(true);

    const result = renewContract(driverWith1Year, 2, 1.10);
    expect(result.success).toBe(true);
    expect(result.updatedEmployee.contractYears).toBe(3); // 1 + 2
    expect(result.updatedEmployee.salary).toBe(Math.round(8_000_000 * 1.10));
  });

  it('debe renovar adecuadamente a un jefe de ingenieros con 1 año restante', () => {
    const result = renewContract(engineerWith1Year, 1, 1.05);
    expect(result.success).toBe(true);
    expect(result.updatedEmployee.contractYears).toBe(2);
    expect(result.updatedEmployee.salary).toBe(Math.round(3_000_000 * 1.05));
  });

  it('debe pasar automáticamente a la agencia libre a los empleados con 0 años tras expiración anual (AC-04.4)', () => {
    // driverWith1Year has 1 year -> after expiration, reaches 0 years!
    // driverWith2Years has 2 years -> after expiration, reaches 1 year!
    const expiration = processContractExpirations(
      [driverWith2Years, driverWith1Year],
      [engineerWith1Year],
      [team]
    );

    expect(expiration.expiredDriverIds).toContain('d-1year');
    expect(expiration.expiredEngineerIds).toContain('eng-1year');

    // Expired driver is now a free agent
    const expiredDriver = expiration.updatedDrivers.find((d) => d.id === 'd-1year');
    expect(expiredDriver?.teamId).toBeNull();
    expect(expiredDriver?.contractYears).toBe(0);

    // Retained driver still with team
    const retainedDriver = expiration.updatedDrivers.find((d) => d.id === 'd-2years');
    expect(retainedDriver?.teamId).toBe('team-1');
    expect(retainedDriver?.contractYears).toBe(1);

    // Team has vacated seat
    const updatedTeam = expiration.updatedTeams.find((t) => t.id === 'team-1');
    expect(updatedTeam?.driverIds[1]).toBe('');
    expect(updatedTeam?.chiefEngineerId).toBe('');
  });
});
