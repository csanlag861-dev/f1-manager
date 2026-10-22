import { Driver, Team, Car, ChiefEngineer, Circuit, QualyResultEntry } from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';
import { RandomGenerator, normalRandom } from './random';

export interface QualyDriverScore {
  driverId: string;
  teamId: string;
  score: number;
  hasIncident: boolean;
  incidentReason?: string;
}

export function calculateCarPerformance(car: Car, circuit: Circuit): number {
  const demandSum = circuit.topSpeedDemand + circuit.downforceDemand;
  if (demandSum <= 0) return (car.topSpeed + car.downforce) / 2;
  return (circuit.topSpeedDemand * car.topSpeed + circuit.downforceDemand * car.downforce) / demandSum;
}

export function evaluateQualyIncident(
  car: Car | undefined,
  driver: Driver | undefined,
  config: SimulationConfig = defaultSimulationConfig,
  rng: RandomGenerator = Math.random
): { hasIncident: boolean; incidentReason?: string } {
  const reliabilityNorm = (car?.reliability ?? 80) / 100;
  const consistencyNorm = (driver?.consistency ?? 80) / 100;

  const probMech = (1 - reliabilityNorm) * 0.5 * config.qualyIncidentFactor;
  const probDriver = (1 - consistencyNorm) * 0.5 * config.qualyIncidentFactor;
  const roll = rng();

  if (roll < probMech) {
    return { hasIncident: true, incidentReason: 'Avería mecánica en Qualy' };
  } else if (roll < probMech + probDriver) {
    return { hasIncident: true, incidentReason: 'Salida de pista en vuelta rápida' };
  }

  return { hasIncident: false };
}

export function simulateQualySession(
  drivers: Driver[],
  teams: Team[],
  cars: Car[],
  engineers: ChiefEngineer[],
  circuit: Circuit,
  config: SimulationConfig = defaultSimulationConfig,
  rng: RandomGenerator = Math.random
): QualyResultEntry[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const carMap = new Map(cars.map((c) => [c.id, c]));
  const engineerMap = new Map(engineers.map((e) => [e.id, e]));

  const cleanDrivers: QualyDriverScore[] = [];
  const incidentDrivers: QualyDriverScore[] = [];

  for (const driver of drivers) {
    const team = driver.teamId ? teamMap.get(driver.teamId) : undefined;
    const car = team ? carMap.get(team.carId) : undefined;
    const engineer = team ? engineerMap.get(team.chiefEngineerId) : undefined;

    // Check for incident in Qualy
    const incidentResult = evaluateQualyIncident(car, driver, config, rng);

    const carPerf = car ? calculateCarPerformance(car, circuit) : 50;
    const driverQualy = 0.7 * driver.pace + 0.3 * driver.consistency;
    const setupPerf = engineer ? engineer.setupPerformance : 50;
    const noise = normalRandom(0, config.qualyRandomSigma * 100, rng);

    const score =
      config.qualyCarWeight * carPerf +
      config.qualyDriverWeight * driverQualy +
      config.qualySetupWeight * setupPerf +
      noise;

    const entry: QualyDriverScore = {
      driverId: driver.id,
      teamId: driver.teamId || '',
      score,
      hasIncident: incidentResult.hasIncident,
      incidentReason: incidentResult.incidentReason,
    };

    if (incidentResult.hasIncident) {
      incidentDrivers.push(entry);
    } else {
      cleanDrivers.push(entry);
    }
  }

  // Sort clean drivers descending by score
  cleanDrivers.sort((a, b) => b.score - a.score);

  // Sort incident drivers descending by score among themselves
  incidentDrivers.sort((a, b) => b.score - a.score);

  const bestScore = cleanDrivers[0]?.score ?? 100;
  const basePoleLapTimeSeconds = 80.0;
  const finalResults: QualyResultEntry[] = [];

  // 1. Clean drivers occupy top positions
  cleanDrivers.forEach((entry, index) => {
    const deltaSeconds = Math.max(0, (bestScore - entry.score) * 0.06);
    const lapTimeSeconds = +(basePoleLapTimeSeconds + deltaSeconds).toFixed(3);
    const timeGap = index === 0 ? 'POLE' : `+${deltaSeconds.toFixed(3)}s`;

    finalResults.push({
      driverId: entry.driverId,
      teamId: entry.teamId,
      position: index + 1,
      lapTimeSeconds,
      timeGap,
      hasIncident: false,
    });
  });

  // 2. Incident drivers relegated to the back of the grid (puestos 18-20)
  incidentDrivers.forEach((entry, index) => {
    const position = cleanDrivers.length + index + 1;
    const deltaSeconds = 3.5 + index * 0.3;
    const lapTimeSeconds = +(basePoleLapTimeSeconds + deltaSeconds).toFixed(3);
    const timeGap = `+${deltaSeconds.toFixed(3)}s (Incidente)`;

    finalResults.push({
      driverId: entry.driverId,
      teamId: entry.teamId,
      position,
      lapTimeSeconds,
      timeGap,
      hasIncident: true,
      incidentReason: entry.incidentReason,
    });
  });

  return finalResults;
}
