import { Team } from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';

export type FacilityType = 'factory' | 'simulator';

/**
 * Calculates the cost of upgrading a facility to the next level.
 * Satisfies AC-03.6.
 */
export function calculateFacilityUpgradeCost(
  type: FacilityType,
  currentLevel: number,
  config: SimulationConfig = defaultSimulationConfig
): number {
  return config.facilityUpgradeBaseCost * currentLevel;
}

/**
 * Upgrades a facility (factory or simulator) by 1 level if conditions are met.
 * Validates maximum level (5) and sufficient budget.
 * Deducts cost and increases level immediately.
 * Satisfies AC-03.6.
 */
export function upgradeFacility(
  team: Team,
  type: FacilityType,
  config: SimulationConfig = defaultSimulationConfig
): {
  success: boolean;
  updatedTeam: Team;
  cost: number;
  newLevel: number;
  error?: string;
} {
  const currentLevel = type === 'factory' ? team.factoryLevel : team.simulatorLevel;

  if (currentLevel >= config.maxFacilityLevel) {
    return {
      success: false,
      updatedTeam: team,
      cost: 0,
      newLevel: currentLevel,
      error: `La instalación ya se encuentra en el nivel máximo permitido (Nivel ${config.maxFacilityLevel}).`,
    };
  }

  const cost = calculateFacilityUpgradeCost(type, currentLevel, config);

  if (team.budget < cost) {
    return {
      success: false,
      updatedTeam: team,
      cost,
      newLevel: currentLevel,
      error: `Presupuesto insuficiente: se requieren $${cost.toLocaleString()} para ampliar la instalación.`,
    };
  }

  const updatedTeam: Team = {
    ...team,
    budget: team.budget - cost,
    factoryLevel: type === 'factory' ? currentLevel + 1 : team.factoryLevel,
    simulatorLevel: type === 'simulator' ? currentLevel + 1 : team.simulatorLevel,
  };

  return {
    success: true,
    updatedTeam,
    cost,
    newLevel: currentLevel + 1,
  };
}
