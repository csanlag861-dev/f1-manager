import { Car, CarAttribute, ChiefEngineer, Team, UpgradeProject } from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';
import { RandomGenerator } from '../simulation/random';

export interface UpgradeQuote {
  attribute: CarAttribute;
  cost: number;
  racesRequired: number;
  improvement: number;
  isRetry: boolean;
}

export interface UpgradeDeliveryResult {
  projectId: string;
  attribute: CarAttribute;
  success: boolean;
  improvement: number;
  engineerMoraleDelta: number;
  message: string;
}

/**
 * Calculates cost and duration (in races) for a car upgrade based on
 * factory level and chief engineer development efficiency.
 * Satisfies AC-03.3 and AC-03.5.
 */
export function calculateUpgradeQuote(
  attribute: CarAttribute,
  team: Pick<Team, 'factoryLevel'>,
  engineer: Pick<ChiefEngineer, 'developmentEfficiency'> | undefined,
  isRetry = false,
  config: SimulationConfig = defaultSimulationConfig
): UpgradeQuote {
  const factoryLevel = Math.max(1, Math.min(config.maxFacilityLevel, team.factoryLevel ?? 1));
  const efficiency = Math.max(1, Math.min(100, engineer?.developmentEfficiency ?? 50));

  // Cost discounts
  const factoryCostDiscount = (factoryLevel - 1) * config.factoryCostDiscountFactor;
  const engineerCostDiscount = (efficiency / 100) * config.engineerCostDiscountFactor;
  const totalCostDiscount = Math.min(0.50, factoryCostDiscount + engineerCostDiscount);

  let cost = Math.round(config.baseUpgradeCost * (1 - totalCostDiscount));
  if (isRetry) {
    cost = Math.round(cost * (1 - config.retryUpgradeDiscount));
  }

  // Delivery duration reduction in races
  let racesReduction = 0;
  if (factoryLevel >= 3) racesReduction += 1;
  if (factoryLevel >= 5) racesReduction += 1;
  if (efficiency >= 85) racesReduction += 1;

  const racesRequired = Math.max(1, config.baseUpgradeRaces - racesReduction);
  const improvement = config.upgradeImprovementAmount;

  return {
    attribute,
    cost,
    racesRequired,
    improvement,
    isRetry,
  };
}

/**
 * Orders a car upgrade project, validating concurrency limit (max 2) and budget.
 * Deducts cost and adds project to car.
 * Satisfies AC-03.1, AC-03.2.
 */
export function orderUpgrade(
  car: Car,
  team: Team,
  engineer: ChiefEngineer | undefined,
  attribute: CarAttribute,
  isRetry = false,
  config: SimulationConfig = defaultSimulationConfig
): {
  success: boolean;
  updatedCar: Car;
  updatedTeam: Team;
  newProject?: UpgradeProject;
  error?: string;
} {
  // Check concurrency limit (AC-03.2)
  if (car.upgradesInProgress.length >= config.maxConcurrentUpgrades) {
    return {
      success: false,
      updatedCar: car,
      updatedTeam: team,
      error: `Capacidad máxima alcanzada: la fábrica ya tiene ${config.maxConcurrentUpgrades} mejoras activas simultáneamente.`,
    };
  }

  // Calculate quote (AC-03.3, AC-03.5)
  const quote = calculateUpgradeQuote(attribute, team, engineer, isRetry, config);

  // Check budget
  if (team.budget < quote.cost) {
    return {
      success: false,
      updatedCar: car,
      updatedTeam: team,
      error: 'Presupuesto insuficiente para encargar la mejora técnica.',
    };
  }

  const newProject: UpgradeProject = {
    id: `upg-${attribute}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    attribute,
    racesRemaining: quote.racesRequired,
    cost: quote.cost,
    improvement: quote.improvement,
    isRetry,
  };

  const updatedCar: Car = {
    ...car,
    upgradesInProgress: [...car.upgradesInProgress, newProject],
  };

  const updatedTeam: Team = {
    ...team,
    budget: team.budget - quote.cost,
  };

  return {
    success: true,
    updatedCar,
    updatedTeam,
    newProject,
  };
}

/**
 * Evaluates success vs failure probability based on engineer morale.
 * Satisfies AC-03.4 and AC-03.5:
 * P(Exito) = BaseSuccessRate + (morale * upgradeMoraleFactor)
 */
export function calculateUpgradeSuccessProbability(
  engineerMorale: number,
  config: SimulationConfig = defaultSimulationConfig
): number {
  const prob = config.baseUpgradeSuccessRate + engineerMorale * config.upgradeMoraleFactor;
  return Math.max(0.05, Math.min(0.98, prob));
}

/**
 * Progresses all active upgrades after a race, evaluating delivery
 * for projects whose duration reached 0.
 * Satisfies AC-03.4 and AC-03.5.
 */
export function processUpgradesDelivery(
  car: Car,
  engineer: ChiefEngineer | undefined,
  config: SimulationConfig = defaultSimulationConfig,
  rng: RandomGenerator = Math.random
): {
  updatedCar: Car;
  updatedEngineer: ChiefEngineer | undefined;
  deliveryResults: UpgradeDeliveryResult[];
  failedAttributes: CarAttribute[];
} {
  const remainingProjects: UpgradeProject[] = [];
  const deliveryResults: UpgradeDeliveryResult[] = [];
  const failedAttributes: CarAttribute[] = [];

  let currentCar = { ...car };
  let currentEngineer = engineer ? { ...engineer } : undefined;

  for (const project of car.upgradesInProgress) {
    const updatedRaces = project.racesRemaining - 1;

    if (updatedRaces > 0) {
      // Still in progress
      remainingProjects.push({
        ...project,
        racesRemaining: updatedRaces,
      });
    } else {
      // Completed, evaluate success vs failure
      const engineerMorale = currentEngineer?.morale ?? 70;
      const successProb = calculateUpgradeSuccessProbability(engineerMorale, config);
      const isSuccess = rng() < successProb;

      if (isSuccess) {
        // Successful upgrade (AC-03.4)
        const currentVal = currentCar[project.attribute];
        const newVal = Math.min(100, currentVal + project.improvement);
        currentCar = {
          ...currentCar,
          [project.attribute]: newVal,
        };

        deliveryResults.push({
          projectId: project.id,
          attribute: project.attribute,
          success: true,
          improvement: project.improvement,
          engineerMoraleDelta: 0,
          message: `Mejora de ${project.attribute} completada con éxito (+${project.improvement} pts).`,
        });
      } else {
        // Failed upgrade (AC-03.5)
        const penalty = config.upgradeFailMoralePenalty; // 3 points
        if (currentEngineer) {
          currentEngineer = {
            ...currentEngineer,
            morale: Math.max(0, currentEngineer.morale - penalty),
          };
        }

        failedAttributes.push(project.attribute);

        deliveryResults.push({
          projectId: project.id,
          attribute: project.attribute,
          success: false,
          improvement: 0,
          engineerMoraleDelta: -penalty,
          message: `Fallo técnico en el desarrollo de ${project.attribute}. El Jefe de Ingenieros pierde ${penalty} puntos de moral.`,
        });
      }
    }
  }

  currentCar = {
    ...currentCar,
    upgradesInProgress: remainingProjects,
  };

  return {
    updatedCar: currentCar,
    updatedEngineer: currentEngineer,
    deliveryResults,
    failedAttributes,
  };
}
