import { describe, it, expect } from 'vitest';
import { calculateDnfRepairCost } from '@/domain/economy/finances';
import { Car } from '@/domain/models';
import { defaultSimulationConfig } from '@/config/simulationConfig';

describe('Tarea 3.3: Sanción Económica por Reparación de DNF Proporcional (AC-06.5)', () => {
  const baseCar50: Car = {
    id: 'car-base',
    teamId: 'team-base',
    topSpeed: 50,
    downforce: 50,
    reliability: 50,
    upgradesInProgress: [],
  };

  const upgradedCar80: Car = {
    id: 'car-upgraded',
    teamId: 'team-upgraded',
    topSpeed: 80,
    downforce: 80,
    reliability: 80,
    upgradesInProgress: [],
  };

  it('debe calcular 0 coste de reparación si no hay abandonos (DNF = 0)', () => {
    expect(calculateDnfRepairCost(baseCar50, 0, defaultSimulationConfig)).toBe(0);
    expect(calculateDnfRepairCost(upgradedCar80, 0, defaultSimulationConfig)).toBe(0);
  });

  it('debe demostrar que un coche con mejoras al 80 sufre un coste de reparación estrictamente mayor que un coche base al 50', () => {
    const cost50 = calculateDnfRepairCost(baseCar50, 1, defaultSimulationConfig);
    const cost80 = calculateDnfRepairCost(upgradedCar80, 1, defaultSimulationConfig);

    // Base repair cost = 500,000, factor = 0.03
    // cost50 = 500,000 * (1 + 0.03 * 50) = 500,000 * 2.5 = 1,250,000
    // cost80 = 500,000 * (1 + 0.03 * 80) = 500,000 * 3.4 = 1,700,000
    expect(cost50).toBe(1250000);
    expect(cost80).toBe(1700000);
    expect(cost80).toBeGreaterThan(cost50);
  });

  it('debe escalar linealmente con el número de monoplazas retirados (2 DNFs)', () => {
    const singleDnfCost = calculateDnfRepairCost(upgradedCar80, 1, defaultSimulationConfig);
    const doubleDnfCost = calculateDnfRepairCost(upgradedCar80, 2, defaultSimulationConfig);

    expect(doubleDnfCost).toBe(singleDnfCost * 2);
  });
});
