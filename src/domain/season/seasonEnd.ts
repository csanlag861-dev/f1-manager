import {
  Team,
  DriverStanding,
  ConstructorStanding,
  ManagerProfile,
  TrophyCabinet,
  GameState,
  TeamPrincipalOffer,
  SeasonTransitionSummary,
} from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';
import { sortConstructorStandings, sortDriverStandings } from './standings';

export interface FiaPrizeAllocation {
  teamId: string;
  position: number;
  prize: number;
}

/**
 * Distributes official FIA constructor prize money to all teams based on their
 * final position in the Constructors Championship.
 * Satisfies AC-08.1.
 */
export function distributeFiaConstructorPrizes(
  teams: Team[],
  constructorStandings: ConstructorStanding[],
  config: SimulationConfig = defaultSimulationConfig
): {
  updatedTeams: Team[];
  allocations: FiaPrizeAllocation[];
} {
  const sortedStandings = sortConstructorStandings(constructorStandings);
  const allocations: FiaPrizeAllocation[] = [];
  const prizeMap = new Map<string, number>();

  sortedStandings.forEach((standing, index) => {
    const position = index + 1;
    const prize = config.fiaConstructorPrizeDistribution[index] ?? 0;
    allocations.push({
      teamId: standing.teamId,
      position,
      prize,
    });
    prizeMap.set(standing.teamId, prize);
  });

  const updatedTeams = teams.map((team) => {
    const prize = prizeMap.get(team.id) ?? 0;
    return {
      ...team,
      budget: team.budget + prize,
    };
  });

  return {
    updatedTeams,
    allocations,
  };
}

export interface BoardEvaluationResult {
  actualPosition: number;
  targetPosition: number;
  metTarget: boolean;
  positionDeficit: number; // actual - target (<= 0 means met or exceeded)
  tpRatingDelta: number;
  isDismissed: boolean;
  message: string;
}

/**
 * Evaluates season sporting performance against board expectations and calculates tpRating delta.
 * If performance falls significantly below expectations, flags manager for dismissal.
 * Satisfies AC-08.2.
 */
export function evaluateBoardExpectations(
  playerTeam: Team,
  constructorStandings: ConstructorStanding[],
  config: SimulationConfig = defaultSimulationConfig
): BoardEvaluationResult {
  const sortedStandings = sortConstructorStandings(constructorStandings);
  const rankIndex = sortedStandings.findIndex((s) => s.teamId === playerTeam.id);
  const actualPosition = rankIndex >= 0 ? rankIndex + 1 : sortedStandings.length;
  const targetPosition = playerTeam.boardExpectations.targetConstructorsPosition;
  const positionDeficit = actualPosition - targetPosition;

  let tpRatingDelta: number;
  let metTarget: boolean;
  let isDismissed = false;
  let message: string;

  if (positionDeficit < 0) {
    // Exceeded expectation (e.g. finished 2nd when target was 4th)
    const bonus = Math.min(
      config.boardTargetSuccessMaxBonus,
      config.boardTargetSuccessMinBonus + Math.abs(positionDeficit) * 2
    );
    tpRatingDelta = bonus;
    metTarget = true;
    message = '¡Objetivo superado con honores! La directiva y los accionistas elogian tu liderazgo deportivo.';
  } else if (positionDeficit === 0) {
    // Exactly met expectation
    tpRatingDelta = config.boardTargetExactBonus;
    metTarget = true;
    message = 'Objetivo cumplido con rigor. La junta directiva confirma su total confianza en tu proyecto.';
  } else {
    // Failed to meet target
    const penalty = Math.min(
      config.boardTargetFailureMaxPenalty,
      config.boardTargetFailureMinPenalty + (positionDeficit - 1) * 3
    );
    tpRatingDelta = -penalty;
    metTarget = false;
    isDismissed = positionDeficit >= config.dismissalThresholdPositions;

    if (isDismissed) {
      message = 'La junta directiva ha decidido relevarte de tu cargo de Team Principal por no alcanzar las metas mínimas exigidas.';
    } else {
      message = 'Rendimiento por debajo de las expectativas. La directiva manifiesta su preocupación pero te concede un voto de confianza.';
    }
  }

  return {
    actualPosition,
    targetPosition,
    metTarget,
    positionDeficit,
    tpRatingDelta,
    isDismissed,
    message,
  };
}

/**
 * Clamps rating within the 0 to 100 range.
 */
export function calculateUpdatedTpRating(currentRating: number, delta: number): number {
  return Math.max(0, Math.min(100, Math.round(currentRating + delta)));
}

/**
 * Returns minimum required tpRating for a team based on its reputation tier.
 */
export function getRequiredTpRatingForTeam(reputation: number): number {
  if (reputation >= 95) return 80;
  if (reputation >= 90) return 75;
  if (reputation >= 80) return 65;
  if (reputation >= 75) return 55;
  if (reputation >= 70) return 45;
  return 35;
}

/**
 * Generates Team Principal job offers and rescue offers based on current tpRating and dismissal status.
 * Satisfies AC-08.3 and AC-08.4.
 */
export function generateTeamPrincipalOffers(
  playerTeam: Team,
  allTeams: Team[],
  tpRating: number,
  isDismissed: boolean
): TeamPrincipalOffer[] {
  const offers: TeamPrincipalOffer[] = [];

  if (!isDismissed) {
    // Current team contract renewal offer
    offers.push({
      teamId: playerTeam.id,
      teamName: playerTeam.name,
      reputation: playerTeam.reputation,
      budget: playerTeam.budget,
      targetConstructorsPosition: playerTeam.boardExpectations.targetConstructorsPosition,
      isCurrentTeam: true,
      isRescueOffer: false,
      message: 'Renovar contrato para continuar al frente del proyecto deportivo.',
    });
  }

  // Evaluate other teams interested in hiring the manager
  for (const team of allTeams) {
    if (team.id === playerTeam.id) continue;

    const minRatingRequired = getRequiredTpRatingForTeam(team.reputation);
    if (tpRating >= minRatingRequired) {
      offers.push({
        teamId: team.id,
        teamName: team.name,
        reputation: team.reputation,
        budget: team.budget,
        targetConstructorsPosition: team.boardExpectations.targetConstructorsPosition,
        isCurrentTeam: false,
        isRescueOffer: isDismissed,
        message: isDismissed
          ? 'Oferta de rescate: la directiva confía en tu experiencia para liderar su monoplaza.'
          : 'Propuesta formal de contratación: proyecto deportivo con ambición de crecimiento.',
      });
    }
  }

  // Sort offers: current team first (if present), then highest reputation
  return offers.sort((a, b) => {
    if (a.isCurrentTeam) return -1;
    if (b.isCurrentTeam) return 1;
    return b.reputation - a.reputation;
  });
}

/**
 * Computes an honorary title for the 10-year legacy screen based on trophies and achievements.
 * Satisfies AC-08.6.
 */
export function calculateHonoraryTitle(trophyCabinet: TrophyCabinet): string {
  const totalChampionships = trophyCabinet.driversChampionships + trophyCabinet.constructorsChampionships;

  if (totalChampionships >= 6) {
    return 'Leyenda Absoluta e Inmortal de la Fórmula 1';
  }
  if (totalChampionships >= 3) {
    return 'Director Laureado de Élite Histórica';
  }
  if (totalChampionships >= 1) {
    return 'Campeón del Mundo de Fórmula 1';
  }
  if (trophyCabinet.totalWins >= 5) {
    return 'Maestro Estratega y Ganador de Grandes Premios';
  }
  if (trophyCabinet.totalPodiums >= 10) {
    return 'Director Consolidado y Habitual del Podio';
  }
  return 'Veterano Resiliente de la Parrilla';
}

export interface SeasonEndResult {
  updatedTeams: Team[];
  updatedManager: ManagerProfile;
  fiaAllocations: FiaPrizeAllocation[];
  boardEvaluation: BoardEvaluationResult;
  offers: TeamPrincipalOffer[];
  summary: SeasonTransitionSummary;
  isGameOverDismissal: boolean;
  isCareerCompleted: boolean;
}

/**
 * Coordinates end-of-season calculations: FIA constructor prizes, board evaluation,
 * rating recalculation, trophy cabinet accumulation, and offer generation.
 */
export function processSeasonEnd(
  gameState: GameState,
  config: SimulationConfig = defaultSimulationConfig
): SeasonEndResult {
  const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
  if (!playerTeam) {
    throw new Error(`Escudería del jugador con ID ${gameState.playerTeamId} no encontrada`);
  }

  // 1. Distribute FIA Constructor Prizes (AC-08.1)
  const fiaResult = distributeFiaConstructorPrizes(
    gameState.teams,
    gameState.season.constructorStandings,
    config
  );
  const playerPrize = fiaResult.allocations.find((a) => a.teamId === playerTeam.id)?.prize ?? 0;

  // 2. Evaluate Board Expectations and calculate rating delta (AC-08.2)
  const boardEvaluation = evaluateBoardExpectations(
    playerTeam,
    gameState.season.constructorStandings,
    config
  );

  const previousTpRating = gameState.managerProfile.tpRating;
  const newTpRating = calculateUpdatedTpRating(previousTpRating, boardEvaluation.tpRatingDelta);

  // 3. Trophies and career stats
  const sortedDrivers = sortDriverStandings(gameState.season.driverStandings);
  const sortedConstructors = sortConstructorStandings(gameState.season.constructorStandings);

  const driverChampionDriverId = sortedDrivers[0]?.driverId ?? '';
  const constructorChampionTeamId = sortedConstructors[0]?.teamId ?? '';

  const wonDriverChampionship = playerTeam.driverIds.includes(driverChampionDriverId);
  const wonConstructorChampionship = constructorChampionTeamId === playerTeam.id;

  // Calculate season wins and podiums by player's drivers
  const playerDriverIds = new Set(playerTeam.driverIds);
  let seasonWins = 0;
  let seasonPodiums = 0;

  for (const ds of gameState.season.driverStandings) {
    if (playerDriverIds.has(ds.driverId)) {
      seasonWins += ds.wins;
      seasonPodiums += ds.podiums;
    }
  }

  const updatedTrophies: TrophyCabinet = {
    driversChampionships:
      gameState.managerProfile.trophyCabinet.driversChampionships + (wonDriverChampionship ? 1 : 0),
    constructorsChampionships:
      gameState.managerProfile.trophyCabinet.constructorsChampionships + (wonConstructorChampionship ? 1 : 0),
    totalWins: gameState.managerProfile.trophyCabinet.totalWins + seasonWins,
    totalPodiums: gameState.managerProfile.trophyCabinet.totalPodiums + seasonPodiums,
  };

  const currentTeamsManaged = gameState.managerProfile.teamsManaged ?? [];
  const updatedTeamsManaged = currentTeamsManaged.includes(playerTeam.id)
    ? currentTeamsManaged
    : [...currentTeamsManaged, playerTeam.id];

  const newSeasonsCompleted = gameState.managerProfile.seasonsCompleted + 1;
  const isCareerCompleted = newSeasonsCompleted >= config.maxCareerSeasons;

  const honoraryTitle = isCareerCompleted ? calculateHonoraryTitle(updatedTrophies) : undefined;

  const updatedManager: ManagerProfile = {
    ...gameState.managerProfile,
    tpRating: newTpRating,
    seasonsCompleted: newSeasonsCompleted,
    trophyCabinet: updatedTrophies,
    teamsManaged: updatedTeamsManaged,
    honoraryTitle,
  };

  // 4. Generate Team Principal offers / rescue offers (AC-08.3, AC-08.4)
  const offers = generateTeamPrincipalOffers(
    playerTeam,
    fiaResult.updatedTeams,
    newTpRating,
    boardEvaluation.isDismissed
  );

  // 5. Game Over Dismissal check (AC-08.5)
  const isGameOverDismissal = boardEvaluation.isDismissed && offers.length === 0;

  // 6. Assemble Season Transition Summary
  const summary: SeasonTransitionSummary = {
    seasonNumber: gameState.season.seasonNumber,
    constructorChampionTeamId,
    driverChampionDriverId,
    playerConstructorPosition: boardEvaluation.actualPosition,
    playerTargetPosition: boardEvaluation.targetPosition,
    playerTargetMet: boardEvaluation.metTarget,
    playerIsDismissed: boardEvaluation.isDismissed,
    previousTpRating,
    newTpRating,
    tpRatingDelta: boardEvaluation.tpRatingDelta,
    fiaPrizeEarned: playerPrize,
    availableOffers: offers,
    isGameOverDismissal,
    isCareerCompleted,
  };

  return {
    updatedTeams: fiaResult.updatedTeams,
    updatedManager,
    fiaAllocations: fiaResult.allocations,
    boardEvaluation,
    offers,
    summary,
    isGameOverDismissal,
    isCareerCompleted,
  };
}
