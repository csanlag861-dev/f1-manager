import { describe, it, expect } from 'vitest';
import { calculateSponsorIncome } from '@/domain/economy/finances';
import { Team, RaceResultEntry } from '@/domain/models';

describe('Tarea 3.1: Contratos de Patrocinio y Liquidación por GP (AC-02.2)', () => {
  const teamPodiumTarget: Team = {
    id: 'ferrari',
    name: 'Scuderia Ferrari',
    budget: 100000000,
    baseBudget: 100000000,
    boardExpectations: { targetConstructorsPosition: 1, description: 'Win' },
    reputation: 95,
    factoryLevel: 5,
    simulatorLevel: 5,
    carId: 'car-ferrari',
    driverIds: ['leclerc', 'hamilton'],
    chiefEngineerId: 'eng-1',
    youthDriverIds: [],
    sponsor: {
      id: 'sp-hp',
      name: 'HP',
      baseIncomePerRace: 2400000,
      bonusTarget: 'podium',
      bonusTargetDescription: 'Al menos un monoplaza en el podio',
      bonusIncome: 1400000,
      remainingRaces: 24,
    },
  };

  const teamTop10Target: Team = {
    ...teamPodiumTarget,
    id: 'williams',
    name: 'Williams',
    driverIds: ['albon', 'sainz'],
    sponsor: {
      id: 'sp-komatsu',
      name: 'Komatsu',
      baseIncomePerRace: 1400000,
      bonusTarget: 'top_10',
      bonusTargetDescription: 'Al menos un monoplaza en el Top 10',
      bonusIncome: 700000,
      remainingRaces: 24,
    },
  };

  it('debe otorgar el pago base garantizado y el bonus si un coche sube al podio (meta podium)', () => {
    const raceResultsWithPodium: RaceResultEntry[] = [
      { driverId: 'leclerc', teamId: 'ferrari', gridPosition: 1, finishPosition: 2, points: 18, isDnf: false, timeGap: '+1.5s' },
      { driverId: 'hamilton', teamId: 'ferrari', gridPosition: 5, finishPosition: 6, points: 8, isDnf: false, timeGap: '+10.2s' },
    ];

    const settlement = calculateSponsorIncome(teamPodiumTarget, raceResultsWithPodium);

    expect(settlement.baseIncome).toBe(2400000);
    expect(settlement.bonusIncome).toBe(1400000);
    expect(settlement.bonusAchieved).toBe(true);
    expect(settlement.totalIncome).toBe(3800000);
  });

  it('debe otorgar únicamente el pago base garantizado si ningún coche hace podio', () => {
    const raceResultsNoPodium: RaceResultEntry[] = [
      { driverId: 'leclerc', teamId: 'ferrari', gridPosition: 4, finishPosition: 4, points: 12, isDnf: false, timeGap: '+6.5s' },
      { driverId: 'hamilton', teamId: 'ferrari', gridPosition: 5, finishPosition: 5, points: 10, isDnf: false, timeGap: '+8.2s' },
    ];

    const settlement = calculateSponsorIncome(teamPodiumTarget, raceResultsNoPodium);

    expect(settlement.baseIncome).toBe(2400000);
    expect(settlement.bonusIncome).toBe(0);
    expect(settlement.bonusAchieved).toBe(false);
    expect(settlement.totalIncome).toBe(2400000);
  });

  it('debe otorgar el bonus para meta top_10 cuando un piloto clasifica en P8', () => {
    const raceResultsTop10: RaceResultEntry[] = [
      { driverId: 'albon', teamId: 'williams', gridPosition: 9, finishPosition: 8, points: 4, isDnf: false, timeGap: '+25.0s' },
      { driverId: 'sainz', teamId: 'williams', gridPosition: 12, finishPosition: 14, points: 0, isDnf: false, timeGap: '+40.0s' },
    ];

    const settlement = calculateSponsorIncome(teamTop10Target, raceResultsTop10);

    expect(settlement.baseIncome).toBe(1400000);
    expect(settlement.bonusIncome).toBe(700000);
    expect(settlement.bonusAchieved).toBe(true);
    expect(settlement.totalIncome).toBe(2100000);
  });

  it('no debe otorgar el bonus si los coches sufren DNF y no completan la carrera', () => {
    const raceResultsBothDnf: RaceResultEntry[] = [
      { driverId: 'leclerc', teamId: 'ferrari', gridPosition: 1, finishPosition: 19, points: 0, isDnf: true, dnfReason: 'Fallo mecánico', timeGap: 'DNF' },
      { driverId: 'hamilton', teamId: 'ferrari', gridPosition: 2, finishPosition: 20, points: 0, isDnf: true, dnfReason: 'Accidente', timeGap: 'DNF' },
    ];

    const settlement = calculateSponsorIncome(teamPodiumTarget, raceResultsBothDnf);

    expect(settlement.baseIncome).toBe(2400000);
    expect(settlement.bonusIncome).toBe(0);
    expect(settlement.bonusAchieved).toBe(false);
    expect(settlement.totalIncome).toBe(2400000);
  });
});
