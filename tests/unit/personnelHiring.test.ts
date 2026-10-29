import { describe, it, expect } from 'vitest';
import {
  calculateDriverRequiredReputation,
  calculateEngineerRequiredReputation,
  evaluateHiringEligibility,
  hireDriver,
  hireChiefEngineer,
} from '../../src/domain/market';
import { Driver, ChiefEngineer, Team } from '../../src/domain/models';

describe('Hito 5: Mercado de Personal - Fichajes y Validación de Reputación (AC-04.1, AC-04.2)', () => {
  const eliteDriver: Driver = {
    id: 'verstappen-elite',
    name: 'Max Verstappen',
    age: 28,
    nationality: 'Países Bajos',
    pace: 96,
    consistency: 92,
    potential: 97,
    morale: 90,
    salary: 45_000_000,
    contractYears: 2,
    teamId: 'red-bull',
  };

  const modestDriver: Driver = {
    id: 'rookie-driver',
    name: 'Rookie Talent',
    age: 21,
    nationality: 'Argentina',
    pace: 79,
    consistency: 77,
    potential: 88,
    morale: 78,
    salary: 3_000_000,
    contractYears: 1,
    teamId: null,
  };

  const topTeam: Team = {
    id: 'ferrari-top',
    name: 'Scuderia Ferrari',
    budget: 90_000_000,
    baseBudget: 90_000_000,
    boardExpectations: { targetConstructorsPosition: 1, description: 'Campeonato' },
    reputation: 96,
    factoryLevel: 5,
    simulatorLevel: 5,
    carId: 'car-ferrari',
    driverIds: ['driver-a', 'driver-b'],
    chiefEngineerId: 'eng-ferrari',
    youthDriverIds: [],
    sponsor: {
      id: 'sp1',
      name: 'HP',
      baseIncomePerRace: 2500000,
      bonusTarget: 'podium',
      bonusTargetDescription: 'Podio',
      bonusIncome: 1500000,
      remainingRaces: 24,
    },
  };

  const modestTeam: Team = {
    id: 'haas-modest',
    name: 'Haas F1 Team',
    budget: 30_000_000,
    baseBudget: 30_000_000,
    boardExpectations: { targetConstructorsPosition: 8, description: 'Puntos' },
    reputation: 68,
    factoryLevel: 2,
    simulatorLevel: 2,
    carId: 'car-haas',
    driverIds: ['driver-c', 'driver-d'],
    chiefEngineerId: 'eng-haas',
    youthDriverIds: [],
    sponsor: {
      id: 'sp2',
      name: 'MoneyGram',
      baseIncomePerRace: 1000000,
      bonusTarget: 'top_10',
      bonusTargetDescription: 'Top 10',
      bonusIncome: 500000,
      remainingRaces: 24,
    },
  };

  describe('Tarea 5.1: Exploración del Mercado y Requisitos de Reputación (AC-04.1)', () => {
    it('debe calcular la reputación exigida a partir del talento de pilotos e ingenieros', () => {
      const eliteReputation = calculateDriverRequiredReputation(eliteDriver);
      const modestReputation = calculateDriverRequiredReputation(modestDriver);

      expect(eliteReputation).toBeGreaterThanOrEqual(94);
      expect(modestReputation).toBeLessThanOrEqual(80);
      expect(eliteReputation).toBeGreaterThan(modestReputation);
    });
  });

  describe('Tarea 5.2: Fichaje y Contratación con Validación de Reputación (AC-04.2)', () => {
    it('debe rechazar el fichaje de un piloto de élite si la escudería tiene prestigio insuficiente', () => {
      // Haas (rep 68) tries to sign Verstappen (demands 94)
      const eligibility = evaluateHiringEligibility(modestTeam, eliteDriver);

      expect(eligibility.canHire).toBe(false);
      expect(eligibility.reason).toContain('prestigio');
      expect(eligibility.reason).toContain('68');
    });

    it('debe permitir y procesar el fichaje de un piloto de élite en una escudería puntera', () => {
      const drivers = [
        eliteDriver,
        {
          id: 'driver-a',
          name: 'Incumbent Driver A',
          age: 28,
          nationality: 'España',
          pace: 88,
          consistency: 86,
          potential: 89,
          morale: 80,
          salary: 10_000_000,
          contractYears: 1,
          teamId: 'ferrari-top',
        },
        {
          id: 'driver-b',
          name: 'Incumbent Driver B',
          age: 26,
          nationality: 'Mónaco',
          pace: 92,
          consistency: 89,
          potential: 94,
          morale: 85,
          salary: 20_000_000,
          contractYears: 2,
          teamId: 'ferrari-top',
        },
      ];

      const initialBudget = topTeam.budget;
      const result = hireDriver(topTeam, eliteDriver, 1, drivers, [topTeam], 3);

      expect(result.success).toBe(true);
      expect(result.updatedTeam.driverIds[0]).toBe('verstappen-elite');
      expect(result.updatedTeam.budget).toBeLessThan(initialBudget);

      // Replaced driver must now be a free agent
      const replacedDriver = result.updatedDrivers.find((d) => d.id === 'driver-a');
      expect(replacedDriver?.teamId).toBeNull();
      expect(replacedDriver?.contractYears).toBe(0);

      // Hired driver has new team and contract duration
      const hiredDriver = result.updatedDrivers.find((d) => d.id === 'verstappen-elite');
      expect(hiredDriver?.teamId).toBe('ferrari-top');
      expect(hiredDriver?.contractYears).toBe(3);
    });

    it('debe rechazar el fichaje si el presupuesto no cubre salario más finiquito del titular', () => {
      const brokeTeam: Team = {
        ...topTeam,
        budget: 5_000_000, // Insufficient for Verstappen (45M)
      };

      const result = hireDriver(brokeTeam, eliteDriver, 1, [eliteDriver], [brokeTeam]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Presupuesto insuficiente');
    });

    it('debe contratar a un jefe de ingenieros sustituyendo al titular y actualizando la plantilla', () => {
      const eliteEngineer: ChiefEngineer = {
        id: 'eng-elite',
        name: 'Adrian Newey',
        developmentEfficiency: 95,
        setupPerformance: 93,
        morale: 90,
        salary: 8_000_000,
        contractYears: 3,
        teamId: null,
      };

      const currentEngineer: ChiefEngineer = {
        id: 'eng-ferrari',
        name: 'Current Ferrari Engineer',
        developmentEfficiency: 88,
        setupPerformance: 87,
        morale: 80,
        salary: 4_000_000,
        contractYears: 1,
        teamId: 'ferrari-top',
      };

      const result = hireChiefEngineer(
        topTeam,
        eliteEngineer,
        [eliteEngineer, currentEngineer],
        [topTeam],
        3
      );

      expect(result.success).toBe(true);
      expect(result.updatedTeam.chiefEngineerId).toBe('eng-elite');

      const oldEng = result.updatedEngineers.find((e) => e.id === 'eng-ferrari');
      expect(oldEng?.teamId).toBeNull();

      const newEng = result.updatedEngineers.find((e) => e.id === 'eng-elite');
      expect(newEng?.teamId).toBe('ferrari-top');
      expect(newEng?.contractYears).toBe(3);
    });
  });
});
