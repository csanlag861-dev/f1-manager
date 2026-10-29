import { describe, it, expect } from 'vitest';
import { updatePostRaceMorale, evaluateDriverPerformanceExpectation } from '../../src/domain/development';
import { Driver, ChiefEngineer, Team, RaceResultEntry } from '../../src/domain/models';
import { defaultSimulationConfig } from '../../src/config/simulationConfig';

describe('Tarea 4.6: Fluctuación de Moral Post-Carrera (±5 puntos) (game-rules 5.3, RF-6.6)', () => {
  const drivers: Driver[] = [
    {
      id: 'driver-top',
      name: 'Top Driver',
      age: 26,
      nationality: 'España',
      pace: 90,
      consistency: 88,
      potential: 92,
      morale: 80,
      salary: 10000000,
      contractYears: 2,
      teamId: 'team-1',
    },
    {
      id: 'driver-low',
      name: 'Struggling Driver',
      age: 24,
      nationality: 'Francia',
      pace: 80,
      consistency: 80,
      potential: 85,
      morale: 80,
      salary: 4000000,
      contractYears: 1,
      teamId: 'team-1',
    },
  ];

  const engineer: ChiefEngineer = {
    id: 'eng-1',
    name: 'Chief Engineer',
    developmentEfficiency: 85,
    setupPerformance: 85,
    morale: 80,
    salary: 3000000,
    contractYears: 2,
    teamId: 'team-1',
  };

  const team: Team = {
    id: 'team-1',
    name: 'Team 1',
    budget: 50000000,
    baseBudget: 50000000,
    boardExpectations: { targetConstructorsPosition: 5, description: 'P5' },
    reputation: 80,
    factoryLevel: 3,
    simulatorLevel: 3,
    carId: 'car-1',
    driverIds: ['driver-top', 'driver-low'],
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

  it('debe aumentar exactamente en +5 la moral del piloto que cumple o supera expectativas', () => {
    // Starting P4, finishing P3 (superó expectativa)
    const raceResults: RaceResultEntry[] = [
      {
        driverId: 'driver-top',
        teamId: 'team-1',
        gridPosition: 4,
        finishPosition: 3,
        totalRaceTimeSeconds: 5000,
        timeGap: '+5.0s',
        points: 15,
        isDnf: false,
      },
      {
        driverId: 'driver-low',
        teamId: 'team-1',
        gridPosition: 10,
        finishPosition: 14, // cayó 4 puestos
        totalRaceTimeSeconds: 5050,
        timeGap: '+55.0s',
        points: 0,
        isDnf: false,
      },
    ];

    const result = updatePostRaceMorale(drivers, [engineer], [team], raceResults);

    const topDriver = result.updatedDrivers.find((d) => d.id === 'driver-top');
    expect(topDriver?.morale).toBe(85); // 80 + 5
  });

  it('debe reducir exactamente en -5 la moral del piloto que no cumple expectativas o sufre DNF', () => {
    const raceResults: RaceResultEntry[] = [
      {
        driverId: 'driver-top',
        teamId: 'team-1',
        gridPosition: 2,
        finishPosition: 20,
        totalRaceTimeSeconds: 0,
        timeGap: 'DNF',
        points: 0,
        isDnf: true,
        dnfReason: 'Accidente',
      },
      {
        driverId: 'driver-low',
        teamId: 'team-1',
        gridPosition: 5,
        finishPosition: 12, // Por debajo de salida
        totalRaceTimeSeconds: 5040,
        timeGap: '+40.0s',
        points: 0,
        isDnf: false,
      },
    ];

    const result = updatePostRaceMorale(drivers, [engineer], [team], raceResults);

    const dnfDriver = result.updatedDrivers.find((d) => d.id === 'driver-top');
    const droppedDriver = result.updatedDrivers.find((d) => d.id === 'driver-low');

    expect(dnfDriver?.morale).toBe(75); // 80 - 5
    expect(droppedDriver?.morale).toBe(75); // 80 - 5
  });

  it('debe ajustar la moral del Jefe de Ingenieros (+5 si puntúa o cumple bonus, -5 si no)', () => {
    // 1. Success case: team scored points
    const pointsResults: RaceResultEntry[] = [
      {
        driverId: 'driver-top',
        teamId: 'team-1',
        gridPosition: 4,
        finishPosition: 5,
        totalRaceTimeSeconds: 5010,
        timeGap: '+10.0s',
        points: 10,
        isDnf: false,
      },
      {
        driverId: 'driver-low',
        teamId: 'team-1',
        gridPosition: 12,
        finishPosition: 15,
        totalRaceTimeSeconds: 5050,
        timeGap: '+50.0s',
        points: 0,
        isDnf: false,
      },
    ];

    const resultSuccess = updatePostRaceMorale(drivers, [engineer], [team], pointsResults);
    expect(resultSuccess.updatedEngineers[0].morale).toBe(85); // 80 + 5

    // 2. Failure case: no points and no sponsor bonus
    const noPointsResults: RaceResultEntry[] = [
      {
        driverId: 'driver-top',
        teamId: 'team-1',
        gridPosition: 8,
        finishPosition: 11,
        totalRaceTimeSeconds: 5030,
        timeGap: '+30.0s',
        points: 0,
        isDnf: false,
      },
      {
        driverId: 'driver-low',
        teamId: 'team-1',
        gridPosition: 12,
        finishPosition: 16,
        totalRaceTimeSeconds: 5060,
        timeGap: '+60.0s',
        points: 0,
        isDnf: false,
      },
    ];

    const resultFail = updatePostRaceMorale(drivers, [engineer], [team], noPointsResults);
    expect(resultFail.updatedEngineers[0].morale).toBe(75); // 80 - 5
  });

  it('debe mantener la moral estrictamente acotada en el rango [0, 100]', () => {
    const extremeDrivers: Driver[] = [
      { ...drivers[0], id: 'max-driver', morale: 98 },
      { ...drivers[1], id: 'min-driver', morale: 3 },
    ];

    const raceResults: RaceResultEntry[] = [
      {
        driverId: 'max-driver',
        teamId: 'team-1',
        gridPosition: 2,
        finishPosition: 1, // +5 points, should clamp to 100
        totalRaceTimeSeconds: 5000,
        timeGap: 'POLE',
        points: 25,
        isDnf: false,
      },
      {
        driverId: 'min-driver',
        teamId: 'team-1',
        gridPosition: 5,
        finishPosition: 18, // -5 points, should clamp to 0
        totalRaceTimeSeconds: 5100,
        timeGap: '+100s',
        points: 0,
        isDnf: false,
      },
    ];

    const result = updatePostRaceMorale(extremeDrivers, [engineer], [team], raceResults);

    const maxDriver = result.updatedDrivers.find((d) => d.id === 'max-driver');
    const minDriver = result.updatedDrivers.find((d) => d.id === 'min-driver');

    expect(maxDriver?.morale).toBe(100); // 98 + 5 = 103 -> 100
    expect(minDriver?.morale).toBe(0); // 3 - 5 = -2 -> 0
  });
});
