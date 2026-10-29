import { Team, Driver, YouthDriver } from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';

export interface SignYouthResult {
  success: boolean;
  updatedTeam: Team;
  updatedYouthDriver: YouthDriver;
  error?: string;
}

export interface PromoteYouthResult {
  success: boolean;
  updatedTeam: Team;
  newDriver?: Driver;
  updatedDrivers: Driver[];
  updatedYouthDrivers: YouthDriver[];
  error?: string;
}

/**
 * Calculates attribute gain during annual training in the academy.
 * Satisfies AC-05.3 & RF-5.4:
 * Growth is driven by the driver's potential and amplified by the team's simulatorLevel.
 */
export function calculateTrainingGain(currentStat: number, potential: number, simulatorLevel: number): number {
  const remainingMargin = Math.max(0, potential - currentStat);
  if (remainingMargin === 0) return 0;

  // Simulator level multiplier: Level 1 -> 1.0, Level 3 -> 1.6, Level 5 -> 2.2
  const simMultiplier = 1 + (simulatorLevel - 1) * 0.3;
  const rawGain = Math.round((potential / 28) * simMultiplier);
  const gain = Math.max(1, Math.min(remainingMargin, rawGain));
  return gain;
}

/**
 * Signs a prospective youth driver into the team's academy.
 * Satisfies AC-05.2 & RF-5.1:
 * Enforces strict limit of 2 concurrent youth drivers.
 * No individual salary cost (covered by simulator maintenance).
 */
export function signYouthDriver(
  team: Team,
  candidate: YouthDriver,
  config: SimulationConfig = defaultSimulationConfig
): SignYouthResult {
  const currentCount = team.youthDriverIds.length;
  if (currentCount >= config.maxYouthDrivers) {
    return {
      success: false,
      updatedTeam: team,
      updatedYouthDriver: candidate,
      error: `La academia ha alcanzado el límite máximo de ${config.maxYouthDrivers} plazas ocupadas.`,
    };
  }

  if (candidate.teamId !== null) {
    return {
      success: false,
      updatedTeam: team,
      updatedYouthDriver: candidate,
      error: 'El piloto ya pertenece a otra academia.',
    };
  }

  const updatedTeam: Team = {
    ...team,
    youthDriverIds: [...team.youthDriverIds, candidate.id],
  };

  const updatedYouthDriver: YouthDriver = {
    ...candidate,
    teamId: team.id,
  };

  return {
    success: true,
    updatedTeam,
    updatedYouthDriver,
  };
}

/**
 * Releases a youth driver from the academy into free agency.
 */
export function releaseYouthDriver(
  team: Team,
  youthDriverId: string,
  youthDrivers: YouthDriver[]
): { updatedTeam: Team; updatedYouthDrivers: YouthDriver[] } {
  const updatedTeam: Team = {
    ...team,
    youthDriverIds: team.youthDriverIds.filter((id) => id !== youthDriverId),
  };

  const updatedYouthDrivers = youthDrivers.map((y) =>
    y.id === youthDriverId ? { ...y, teamId: null } : y
  );

  return { updatedTeam, updatedYouthDrivers };
}

/**
 * Annual training progression for youth drivers in all academies.
 * Satisfies AC-05.3.
 */
export function trainYouthDriversAnnual(
  youthDrivers: YouthDriver[],
  teams: Team[]
): YouthDriver[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return youthDrivers.map((youth) => {
    if (!youth.teamId) {
      // Free youth drivers age 1 year with minor natural progression
      return {
        ...youth,
        age: youth.age + 1,
        pace: Math.min(youth.potential, youth.pace + 1),
        consistency: Math.min(youth.potential, youth.consistency + 1),
      };
    }

    const team = teamMap.get(youth.teamId);
    const simLevel = team?.simulatorLevel ?? 1;

    const gainPace = calculateTrainingGain(youth.pace, youth.potential, simLevel);
    const gainCons = calculateTrainingGain(youth.consistency, youth.potential, simLevel);

    return {
      ...youth,
      age: youth.age + 1,
      pace: Math.min(youth.potential, youth.pace + gainPace),
      consistency: Math.min(youth.potential, youth.consistency + gainCons),
    };
  });
}

/**
 * Promotes an academy youth driver to an official F1 race seat.
 * Satisfies AC-05.4 & RF-5.5:
 * Validates vacancy, creates full Driver, assigns to seat, and frees academy slot.
 */
export function promoteYouthDriver(
  team: Team,
  candidate: YouthDriver,
  targetSeat: 1 | 2,
  currentDrivers: Driver[],
  allYouthDrivers: YouthDriver[],
  startingSalary = 2000000,
  contractYears = 2
): PromoteYouthResult {
  const seatIndex = targetSeat - 1;
  const currentSeatDriverId = team.driverIds[seatIndex];

  if (currentSeatDriverId && currentSeatDriverId.trim() !== '') {
    return {
      success: false,
      updatedTeam: team,
      updatedDrivers: currentDrivers,
      updatedYouthDrivers: allYouthDrivers,
      error: `El Asiento ${targetSeat} no se encuentra vacante. Debe rescindir o esperar la finalización del contrato del titular.`,
    };
  }

  if (candidate.teamId !== team.id) {
    return {
      success: false,
      updatedTeam: team,
      updatedDrivers: currentDrivers,
      updatedYouthDrivers: allYouthDrivers,
      error: 'El piloto no pertenece a la academia de esta escudería.',
    };
  }

  const promotedDriver: Driver = {
    id: candidate.id,
    name: candidate.name,
    age: candidate.age,
    nationality: candidate.nationality,
    pace: candidate.pace,
    consistency: candidate.consistency,
    potential: candidate.potential,
    morale: candidate.morale,
    salary: startingSalary,
    contractYears,
    teamId: team.id,
  };

  const newDriverIds: [string, string] = [
    targetSeat === 1 ? promotedDriver.id : team.driverIds[0],
    targetSeat === 2 ? promotedDriver.id : team.driverIds[1],
  ];

  const updatedTeam: Team = {
    ...team,
    driverIds: newDriverIds,
    youthDriverIds: team.youthDriverIds.filter((id) => id !== candidate.id),
  };

  const updatedDrivers = [...currentDrivers, promotedDriver];
  const updatedYouthDrivers = allYouthDrivers.filter((y) => y.id !== candidate.id);

  return {
    success: true,
    updatedTeam,
    newDriver: promotedDriver,
    updatedDrivers,
    updatedYouthDrivers,
  };
}
