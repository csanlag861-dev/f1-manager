import { describe, it, expect } from 'vitest';
import {
  calculateUpgradeQuote,
  orderUpgrade,
  calculateUpgradeSuccessProbability,
  processUpgradesDelivery,
} from '../../src/domain/development';
import { Car, ChiefEngineer, Team } from '../../src/domain/models';
import { defaultSimulationConfig } from '../../src/config/simulationConfig';

describe('Hito 4: Desarrollo del Monoplaza e Instalaciones', () => {
  const baseTeam: Team = {
    id: 'test-team',
    name: 'Test Team',
    budget: 50000000,
    baseBudget: 50000000,
    boardExpectations: { targetConstructorsPosition: 5, description: 'Top 5' },
    reputation: 80,
    factoryLevel: 2,
    simulatorLevel: 2,
    carId: 'test-car',
    driverIds: ['d1', 'd2'],
    chiefEngineerId: 'test-eng',
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

  const baseCar: Car = {
    id: 'test-car',
    teamId: 'test-team',
    topSpeed: 80,
    downforce: 80,
    reliability: 80,
    upgradesInProgress: [],
  };

  const baseEngineer: ChiefEngineer = {
    id: 'test-eng',
    name: 'Lead Engineer',
    developmentEfficiency: 80,
    setupPerformance: 80,
    morale: 80,
    salary: 4000000,
    contractYears: 2,
    teamId: 'test-team',
  };

  describe('Tarea 4.1: Sistema de Mejoras del Monoplaza y Límite de Concurrencia (AC-03.1, AC-03.2)', () => {
    it('debe encargar una mejora deduciendo el presupuesto y añadiendo el proyecto al coche', () => {
      const result = orderUpgrade(baseCar, baseTeam, baseEngineer, 'topSpeed');

      expect(result.success).toBe(true);
      expect(result.updatedCar.upgradesInProgress).toHaveLength(1);
      expect(result.updatedCar.upgradesInProgress[0].attribute).toBe('topSpeed');
      expect(result.updatedTeam.budget).toBeLessThan(baseTeam.budget);
      expect(result.newProject).toBeDefined();
    });

    it('debe bloquear un tercer proyecto simultáneo si ya existen 2 mejoras en curso y no descontar presupuesto', () => {
      // Order 1st upgrade
      const step1 = orderUpgrade(baseCar, baseTeam, baseEngineer, 'topSpeed');
      expect(step1.success).toBe(true);

      // Order 2nd upgrade
      const step2 = orderUpgrade(step1.updatedCar, step1.updatedTeam, baseEngineer, 'downforce');
      expect(step2.success).toBe(true);
      expect(step2.updatedCar.upgradesInProgress).toHaveLength(2);

      const budgetBefore3rd = step2.updatedTeam.budget;

      // Try 3rd upgrade
      const step3 = orderUpgrade(step2.updatedCar, step2.updatedTeam, baseEngineer, 'reliability');
      expect(step3.success).toBe(false);
      expect(step3.error).toContain('Capacidad máxima');
      expect(step3.updatedCar.upgradesInProgress).toHaveLength(2);
      expect(step3.updatedTeam.budget).toBe(budgetBefore3rd);
    });

    it('debe rechazar la mejora si la escudería no tiene presupuesto suficiente', () => {
      const brokeTeam = { ...baseTeam, budget: 1000 };
      const result = orderUpgrade(baseCar, brokeTeam, baseEngineer, 'topSpeed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Presupuesto insuficiente');
      expect(result.updatedCar.upgradesInProgress).toHaveLength(0);
      expect(result.updatedTeam.budget).toBe(1000);
    });
  });

  describe('Tarea 4.2: Tiempos de Entrega y Moduladores de Fábrica e Ingeniero (AC-03.3)', () => {
    it('debe reducir el coste y plazo de carreras con ingeniero de élite y fábrica nivel 5 vs novato con fábrica nivel 1', () => {
      const noviceTeam = { ...baseTeam, factoryLevel: 1 };
      const noviceEngineer = { ...baseEngineer, developmentEfficiency: 50 };

      const eliteTeam = { ...baseTeam, factoryLevel: 5 };
      const eliteEngineer = { ...baseEngineer, developmentEfficiency: 95 };

      const noviceQuote = calculateUpgradeQuote('topSpeed', noviceTeam, noviceEngineer);
      const eliteQuote = calculateUpgradeQuote('topSpeed', eliteTeam, eliteEngineer);

      // Elite must require strictly fewer races than novice
      expect(eliteQuote.racesRequired).toBeLessThan(noviceQuote.racesRequired);

      // Elite must cost strictly less than novice
      expect(eliteQuote.cost).toBeLessThan(noviceQuote.cost);

      // Elite cost must be less than base cost in config
      expect(eliteQuote.cost).toBeLessThan(defaultSimulationConfig.baseUpgradeCost);
    });
  });

  describe('Tarea 4.3: Evaluación de Éxito vs. Fallo Técnico por Moral (AC-03.4, AC-03.5)', () => {
    it('debe calcular mayor probabilidad de éxito con moral alta (90) vs moral baja (10)', () => {
      const probLow = calculateUpgradeSuccessProbability(10);
      const probHigh = calculateUpgradeSuccessProbability(90);

      expect(probHigh).toBeGreaterThan(probLow);
      expect(probLow).toBeCloseTo(0.20 + 10 * 0.0075, 2);
      expect(probHigh).toBeCloseTo(0.20 + 90 * 0.0075, 2);
    });

    it('debe aplicar la mejora exitosa incrementando el atributo del coche de forma permanente', () => {
      const carWithProject: Car = {
        ...baseCar,
        topSpeed: 80,
        upgradesInProgress: [
          {
            id: 'upg-1',
            attribute: 'topSpeed',
            racesRemaining: 1, // Will finish after 1 race
            cost: 3000000,
            improvement: 2,
          },
        ],
      };

      // Force success with RNG returning 0.0 (below success prob)
      const mockRngSuccess = () => 0.0;
      const result = processUpgradesDelivery(carWithProject, baseEngineer, defaultSimulationConfig, mockRngSuccess);

      expect(result.deliveryResults).toHaveLength(1);
      expect(result.deliveryResults[0].success).toBe(true);
      expect(result.updatedCar.topSpeed).toBe(82); // 80 + 2
      expect(result.updatedCar.upgradesInProgress).toHaveLength(0);
      expect(result.failedAttributes).toHaveLength(0);
    });

    it('debe penalizar exactamente con 3 puntos de moral al ingeniero y no incrementar el atributo en caso de fallo técnico', () => {
      const carWithProject: Car = {
        ...baseCar,
        downforce: 80,
        upgradesInProgress: [
          {
            id: 'upg-2',
            attribute: 'downforce',
            racesRemaining: 1,
            cost: 3000000,
            improvement: 2,
          },
        ],
      };

      const initialMorale = 80;
      const engineer = { ...baseEngineer, morale: initialMorale };

      // Force failure with RNG returning 0.99 (above success prob)
      const mockRngFail = () => 0.99;
      const result = processUpgradesDelivery(carWithProject, engineer, defaultSimulationConfig, mockRngFail);

      expect(result.deliveryResults).toHaveLength(1);
      expect(result.deliveryResults[0].success).toBe(false);
      // Downforce unchanged
      expect(result.updatedCar.downforce).toBe(80);
      // Engineer loses exactly 3 points
      expect(result.updatedEngineer?.morale).toBe(initialMorale - 3);
      expect(result.failedAttributes).toContain('downforce');
    });
  });

  describe('Tarea 4.4: Reintento de Mejora Fallida con 50% de Descuento (AC-03.5)', () => {
    it('debe cotizar y aplicar un 50% de descuento cuando se ordena como reintento', () => {
      const regularQuote = calculateUpgradeQuote('downforce', baseTeam, baseEngineer, false);
      const retryQuote = calculateUpgradeQuote('downforce', baseTeam, baseEngineer, true);

      expect(retryQuote.cost).toBe(Math.round(regularQuote.cost * 0.5));
      expect(retryQuote.isRetry).toBe(true);

      const orderResult = orderUpgrade(baseCar, baseTeam, baseEngineer, 'downforce', true);
      expect(orderResult.success).toBe(true);
      expect(orderResult.newProject?.isRetry).toBe(true);
      expect(orderResult.newProject?.cost).toBe(retryQuote.cost);
      expect(orderResult.updatedTeam.budget).toBe(baseTeam.budget - retryQuote.cost);
    });
  });
});
