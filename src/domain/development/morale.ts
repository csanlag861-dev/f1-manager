import { Driver, ChiefEngineer, Team, RaceResultEntry } from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';

export interface MoraleUpdateSummary {
  driverUpdates: {
    driverId: string;
    previousMorale: number;
    newMorale: number;
    delta: number;
    reason: string;
  }[];
  engineerUpdates: {
    engineerId: string;
    previousMorale: number;
    newMorale: number;
    delta: number;
    reason: string;
  }[];
}

/**
 * Evaluates whether a driver met weekend sporting expectations.
 * Satisfies spec/game-rules.md (5.3) and RF-6.6:
 * - Suffered DNF (accident or mechanical) -> does not meet expectation.
 * - Finished at or better than qualifying grid position -> meets expectation.
 * - Alternatively, finished in points (top 10) when starting outside points.
 */
export function evaluateDriverPerformanceExpectation(
  result: RaceResultEntry,
  startGrid: number,
  boardTarget?: number
): boolean {
  if (result.isDnf) {
    return false;
  }

  // Finished at or ahead of starting position
  if (result.finishPosition <= startGrid) {
    return true;
  }

  // Or scored points / fulfilled board expectations
  if (boardTarget && result.finishPosition <= boardTarget) {
    return true;
  }

  return false;
}

/**
 * Updates post-race morale for drivers and chief engineers based on race results.
 * Each update is strictly +/- 5 points (moraleRaceDelta), clamped to [0, 100].
 * Satisfies spec/game-rules.md (5.3), RF-6.6, and AC-03.4/AC-03.5.
 */
export function updatePostRaceMorale(
  drivers: Driver[],
  engineers: ChiefEngineer[],
  teams: Team[],
  raceResults: RaceResultEntry[],
  sponsorBonusAchievedByTeamId: Record<string, boolean> = {},
  config: SimulationConfig = defaultSimulationConfig
): {
  updatedDrivers: Driver[];
  updatedEngineers: ChiefEngineer[];
  summary: MoraleUpdateSummary;
} {
  const delta = config.moraleRaceDelta;
  const resultMap = new Map(raceResults.map((r) => [r.driverId, r]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const summary: MoraleUpdateSummary = {
    driverUpdates: [],
    engineerUpdates: [],
  };

  // 1. Update drivers
  const updatedDrivers = drivers.map((driver) => {
    const raceResult = resultMap.get(driver.id);
    if (!raceResult) return driver;

    const team = driver.teamId ? teamMap.get(driver.teamId) : undefined;
    const boardTarget = team?.boardExpectations.targetConstructorsPosition;

    const metExpectation = evaluateDriverPerformanceExpectation(
      raceResult,
      raceResult.gridPosition,
      boardTarget
    );

    const change = metExpectation ? delta : -delta;
    const newMorale = Math.max(0, Math.min(100, driver.morale + change));

    let reason: string;
    if (raceResult.isDnf) {
      reason = `Abandono (${raceResult.dnfReason || 'DNF'})`;
    } else if (metExpectation) {
      reason = `Cumplió expectativas (Salida P${raceResult.gridPosition} -> Meta P${raceResult.finishPosition})`;
    } else {
      reason = `Por debajo de expectativas (Salida P${raceResult.gridPosition} -> Meta P${raceResult.finishPosition})`;
    }

    summary.driverUpdates.push({
      driverId: driver.id,
      previousMorale: driver.morale,
      newMorale,
      delta: change,
      reason,
    });

    return {
      ...driver,
      morale: newMorale,
    };
  });

  // 2. Update chief engineers
  const updatedEngineers = engineers.map((engineer) => {
    const team = teams.find((t) => t.chiefEngineerId === engineer.id);
    if (!team) return engineer;

    const teamDriverIds: string[] = [team.driverIds[0], team.driverIds[1]];
    const teamResults = raceResults.filter((r) => teamDriverIds.includes(r.driverId));

    // Engineer expectation: at least one car scores points or sponsor bonus achieved
    const scoredPoints = teamResults.some((r) => !r.isDnf && r.points > 0);
    const sponsorAchieved = Boolean(sponsorBonusAchievedByTeamId[team.id]);

    const metExpectation = scoredPoints || sponsorAchieved;
    const change = metExpectation ? delta : -delta;
    const newMorale = Math.max(0, Math.min(100, engineer.morale + change));

    const reason = metExpectation
      ? scoredPoints
        ? 'El equipo puntuó en la carrera'
        : 'Se cumplió el objetivo del patrocinador'
      : 'Sin puntos ni objetivos alcanzados';

    summary.engineerUpdates.push({
      engineerId: engineer.id,
      previousMorale: engineer.morale,
      newMorale,
      delta: change,
      reason,
    });

    return {
      ...engineer,
      morale: newMorale,
    };
  });

  return {
    updatedDrivers,
    updatedEngineers,
    summary,
  };
}
