import { describe, it, expect } from 'vitest';
import { processRivalAiDecisionCycle } from '../../src/domain/market';
import { Team, Car, Driver, ChiefEngineer } from '../../src/domain/models';

describe('Tarea 5.4: IA Autónoma de Escuderías Rivales (AC-07.1, AC-07.2)', () => {
  const playerTeam: Team = {
    id: 'player-team',
    name: 'Player Racing',
    budget: 80_000_000,
    baseBudget: 80_000_000,
    boardExpectations: { targetConstructorsPosition: 1, description: 'Campeón' },
    reputation: 95,
    factoryLevel: 4,
    simulatorLevel: 4,
    carId: 'car-player',
    driverIds: ['p-d1', 'p-d2'],
    chiefEngineerId: 'p-eng',
    youthDriverIds: [],
    sponsor: {
      id: 'sp-p',
      name: 'Player Sponsor',
      baseIncomePerRace: 2000000,
      bonusTarget: 'podium',
      bonusTargetDescription: 'Podio',
      bonusIncome: 1000000,
      remainingRaces: 24,
    },
  };

  const rivalTeam: Team = {
    id: 'rival-mercedes',
    name: 'Mercedes-AMG Rival',
    budget: 60_000_000,
    baseBudget: 60_000_000,
    boardExpectations: { targetConstructorsPosition: 2, description: 'Top 2' },
    reputation: 92,
    factoryLevel: 4,
    simulatorLevel: 4,
    carId: 'car-rival',
    driverIds: ['r-d1', ''], // Seat 2 is VACANT!
    chiefEngineerId: 'r-eng',
    youthDriverIds: [],
    sponsor: {
      id: 'sp-r',
      name: 'Petronas',
      baseIncomePerRace: 2200000,
      bonusTarget: 'podium',
      bonusTargetDescription: 'Podio',
      bonusIncome: 1200000,
      remainingRaces: 24,
    },
  };

  const rivalCar: Car = {
    id: 'car-rival',
    teamId: 'rival-mercedes',
    topSpeed: 88,
    downforce: 85,
    reliability: 82, // Weakest
    upgradesInProgress: [],
  };

  const playerCar: Car = {
    id: 'car-player',
    teamId: 'player-team',
    topSpeed: 92,
    downforce: 92,
    reliability: 90,
    upgradesInProgress: [],
  };

  const drivers: Driver[] = [
    {
      id: 'p-d1',
      name: 'Player Driver 1',
      age: 26,
      nationality: 'España',
      pace: 92,
      consistency: 90,
      potential: 94,
      morale: 85,
      salary: 20_000_000,
      contractYears: 2,
      teamId: 'player-team',
    },
    {
      id: 'p-d2',
      name: 'Player Driver 2',
      age: 24,
      nationality: 'Francia',
      pace: 88,
      consistency: 86,
      potential: 90,
      morale: 82,
      salary: 10_000_000,
      contractYears: 2,
      teamId: 'player-team',
    },
    {
      id: 'r-d1',
      name: 'Rival Star Driver',
      age: 27,
      nationality: 'Reino Unido',
      pace: 91,
      consistency: 89,
      potential: 93,
      morale: 85,
      salary: 18_000_000,
      contractYears: 1, // Eligible for renewal!
      teamId: 'rival-mercedes',
    },
    {
      id: 'free-agent-d',
      name: 'Top Free Agent',
      age: 25,
      nationality: 'Alemania',
      pace: 86,
      consistency: 85,
      potential: 89,
      morale: 80,
      salary: 8_000_000,
      contractYears: 0,
      teamId: null, // Free agent available for hire!
    },
  ];

  const engineers: ChiefEngineer[] = [
    {
      id: 'p-eng',
      name: 'Player Engineer',
      developmentEfficiency: 90,
      setupPerformance: 88,
      morale: 85,
      salary: 4_000_000,
      contractYears: 3,
      teamId: 'player-team',
    },
    {
      id: 'r-eng',
      name: 'Rival Engineer',
      developmentEfficiency: 89,
      setupPerformance: 87,
      morale: 82,
      salary: 4_500_000,
      contractYears: 2,
      teamId: 'rival-mercedes',
    },
  ];

  it('debe ordenar mejoras técnicas autónomas en los coches rivales (AC-07.1)', () => {
    const outcome = processRivalAiDecisionCycle(
      'player-team',
      [playerTeam, rivalTeam],
      [playerCar, rivalCar],
      drivers,
      engineers
    );

    const updatedRivalCar = outcome.updatedCars.find((c) => c.id === 'car-rival');
    expect(updatedRivalCar?.upgradesInProgress.length).toBeGreaterThanOrEqual(1);

    // Player car must NOT be modified by rival AI
    const updatedPlayerCar = outcome.updatedCars.find((c) => c.id === 'car-player');
    expect(updatedPlayerCar?.upgradesInProgress).toHaveLength(0);

    // Rival budget should have decreased due to upgrade cost
    const updatedRivalTeam = outcome.updatedTeams.find((t) => t.id === 'rival-mercedes');
    expect(updatedRivalTeam?.budget).toBeLessThan(rivalTeam.budget);
  });

  it('debe renovar automáticamente a pilotos clave que tienen 1 año restante de contrato (AC-07.2)', () => {
    const outcome = processRivalAiDecisionCycle(
      'player-team',
      [playerTeam, rivalTeam],
      [playerCar, rivalCar],
      drivers,
      engineers
    );

    const rivalDriver = outcome.updatedDrivers.find((d) => d.id === 'r-d1');
    expect(rivalDriver?.contractYears).toBeGreaterThan(1); // 1 + 2 = 3
  });

  it('debe fichar a agentes libres disponibles para cubrir asientos vacantes (AC-07.2)', () => {
    const outcome = processRivalAiDecisionCycle(
      'player-team',
      [playerTeam, rivalTeam],
      [playerCar, rivalCar],
      drivers,
      engineers
    );

    const updatedRivalTeam = outcome.updatedTeams.find((t) => t.id === 'rival-mercedes');
    // Seat 2 was vacant, should now be occupied by the free agent
    expect(updatedRivalTeam?.driverIds[1]).toBe('free-agent-d');

    const hiredDriver = outcome.updatedDrivers.find((d) => d.id === 'free-agent-d');
    expect(hiredDriver?.teamId).toBe('rival-mercedes');
    expect(hiredDriver?.contractYears).toBeGreaterThanOrEqual(1);
  });
});
