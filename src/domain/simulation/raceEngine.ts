import { Driver, Team, Car, ChiefEngineer, Circuit, QualyResultEntry, RaceResultEntry, DnfReason } from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';
import { calculateCarPerformance } from './qualyEngine';
import { RandomGenerator, normalRandom } from './random';

export interface DnfEvaluationResult {
  isDnf: boolean;
  dnfReason?: DnfReason;
  probMech: number;
  probCrash: number;
}

export function calculateDnfProbabilities(
  car: Car | undefined,
  driver: Driver | undefined,
  circuit: Circuit,
  config: SimulationConfig = defaultSimulationConfig
): { probMech: number; probCrash: number; totalProb: number } {
  const reliabilityNorm = (car?.reliability ?? 80) / 100;
  const consistencyNorm = (driver?.consistency ?? 80) / 100;

  const probMech = Math.max(0, (1 - reliabilityNorm) * circuit.reliabilityDemand * config.mechDnfFactor);
  const probCrash = Math.max(0, (1 - consistencyNorm) * config.crashDnfFactor);
  const totalProb = probMech + probCrash;

  return { probMech, probCrash, totalProb };
}

export function evaluateDriverDnf(
  car: Car | undefined,
  driver: Driver | undefined,
  circuit: Circuit,
  config: SimulationConfig = defaultSimulationConfig,
  rng: RandomGenerator = Math.random
): DnfEvaluationResult {
  const { probMech, probCrash } = calculateDnfProbabilities(car, driver, circuit, config);
  const roll = rng();

  if (roll < probMech) {
    return { isDnf: true, dnfReason: 'Fallo mecánico', probMech, probCrash };
  } else if (roll < probMech + probCrash) {
    return { isDnf: true, dnfReason: 'Accidente', probMech, probCrash };
  }

  return { isDnf: false, probMech, probCrash };
}

export interface RaceDriverScore {
  driverId: string;
  teamId: string;
  gridPosition: number;
  score: number;
  isDnf: boolean;
  dnfReason?: DnfReason;
}

export function simulateRaceSession(
  qualyResults: QualyResultEntry[],
  drivers: Driver[],
  teams: Team[],
  cars: Car[],
  engineers: ChiefEngineer[],
  circuit: Circuit,
  config: SimulationConfig = defaultSimulationConfig,
  rng: RandomGenerator = Math.random
): RaceResultEntry[] {
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const carMap = new Map(cars.map((c) => [c.id, c]));
  const engineerMap = new Map(engineers.map((e) => [e.id, e]));

  const activeParticipants: RaceDriverScore[] = [];
  const dnfParticipants: RaceDriverScore[] = [];

  for (const gridEntry of qualyResults) {
    const driver = driverMap.get(gridEntry.driverId);
    const team = driver?.teamId ? teamMap.get(driver.teamId) : undefined;
    const car = team ? carMap.get(team.carId) : undefined;
    const engineer = team ? engineerMap.get(team.chiefEngineerId) : undefined;

    // 1. Evaluate DNF before calculating race performance
    const dnfResult = evaluateDriverDnf(car, driver, circuit, config, rng);

    if (dnfResult.isDnf) {
      dnfParticipants.push({
        driverId: gridEntry.driverId,
        teamId: gridEntry.teamId,
        gridPosition: gridEntry.position,
        score: -999,
        isDnf: true,
        dnfReason: dnfResult.dnfReason,
      });
      continue;
    }

    // 2. Performance score for finishers
    const gridScore = 100 - (gridEntry.position - 1) * 2.5;
    const carPerf = car ? calculateCarPerformance(car, circuit) : 50;

    const morale = driver?.morale ?? 50;
    const moraleMod = 0.9 + 0.2 * (morale / 100);
    const driverScore = (driver?.pace ?? 50) * moraleMod;

    const setupBonus = engineer?.setupPerformance ?? 50;
    const noise = normalRandom(0, config.raceRandomSigma * 100, rng);

    const score =
      config.raceGridWeight * gridScore +
      config.raceCarWeight * carPerf +
      config.raceDriverWeight * driverScore +
      config.raceSetupWeight * setupBonus +
      noise;

    activeParticipants.push({
      driverId: gridEntry.driverId,
      teamId: gridEntry.teamId,
      gridPosition: gridEntry.position,
      score,
      isDnf: false,
    });
  }

  // Sort finishers descending by score
  activeParticipants.sort((a, b) => b.score - a.score);

  const bestScore = activeParticipants[0]?.score ?? 100;
  const results: RaceResultEntry[] = [];

  // Finishers positions 1 to activeParticipants.length
  activeParticipants.forEach((entry, index) => {
    const finishPosition = index + 1;
    const points = config.pointsDistribution[index] ?? 0;
    const deltaSeconds = Math.max(0, (bestScore - entry.score) * 0.85);
    const timeGap = index === 0 ? 'WINNER' : `+${deltaSeconds.toFixed(3)}s`;

    results.push({
      driverId: entry.driverId,
      teamId: entry.teamId,
      gridPosition: entry.gridPosition,
      finishPosition,
      points,
      isDnf: false,
      timeGap,
    });
  });

  // DNFs at the back of the grid, 0 points, timeGap 'DNF'
  dnfParticipants.forEach((entry, index) => {
    const finishPosition = activeParticipants.length + index + 1;
    results.push({
      driverId: entry.driverId,
      teamId: entry.teamId,
      gridPosition: entry.gridPosition,
      finishPosition,
      points: 0,
      isDnf: true,
      dnfReason: entry.dnfReason,
      timeGap: 'DNF',
    });
  });

  return results;
}
