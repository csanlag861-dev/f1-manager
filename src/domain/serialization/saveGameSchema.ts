import { z } from 'zod';
import { GameState } from '../models/gameState';

const trophyCabinetSchema = z.object({
  driversChampionships: z.number().int().min(0),
  constructorsChampionships: z.number().int().min(0),
  totalWins: z.number().int().min(0),
  totalPodiums: z.number().int().min(0),
});

const managerProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre del director no puede estar vacío'),
  tpRating: z.number().min(0).max(100),
  seasonsCompleted: z.number().int().min(0).max(10),
  trophyCabinet: trophyCabinetSchema,
  teamsManaged: z.array(z.string()).optional(),
  honoraryTitle: z.string().optional(),
});

const driverStandingSchema = z.object({
  driverId: z.string(),
  points: z.number().min(0),
  wins: z.number().int().min(0),
  podiums: z.number().int().min(0),
});

const constructorStandingSchema = z.object({
  teamId: z.string(),
  points: z.number().min(0),
  wins: z.number().int().min(0),
  podiums: z.number().int().min(0),
});

const seasonSchema = z.object({
  seasonNumber: z.number().int().min(1).max(10),
  currentRaceIndex: z.number().int().min(0).max(24),
  driverStandings: z.array(driverStandingSchema),
  constructorStandings: z.array(constructorStandingSchema),
});

const sponsorContractSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseIncomePerRace: z.number().min(0),
  bonusTarget: z.string(),
  bonusTargetDescription: z.string(),
  bonusIncome: z.number().min(0),
  remainingRaces: z.number().int().min(0),
});

const boardExpectationsSchema = z.object({
  targetConstructorsPosition: z.number().int().min(1).max(10),
  description: z.string(),
});

const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  budget: z.number(),
  baseBudget: z.number(),
  boardExpectations: boardExpectationsSchema,
  reputation: z.number().min(1).max(100),
  factoryLevel: z.number().int().min(1).max(5),
  simulatorLevel: z.number().int().min(1).max(5),
  carId: z.string(),
  driverIds: z.tuple([z.string(), z.string()]),
  chiefEngineerId: z.string(),
  youthDriverIds: z.array(z.string()),
  sponsor: sponsorContractSchema,
});

const driverSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int().min(15).max(60),
  nationality: z.string(),
  pace: z.number().min(1).max(100),
  consistency: z.number().min(1).max(100),
  potential: z.number().min(1).max(100),
  morale: z.number().min(0).max(100),
  salary: z.number().min(0),
  contractYears: z.number().int().min(0),
  teamId: z.string().nullable(),
});

const youthDriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int().min(15).max(30),
  nationality: z.string(),
  pace: z.number().min(1).max(100),
  consistency: z.number().min(1).max(100),
  potential: z.number().min(1).max(100),
  morale: z.number().min(0).max(100),
  teamId: z.string().nullable(),
});

const chiefEngineerSchema = z.object({
  id: z.string(),
  name: z.string(),
  developmentEfficiency: z.number().min(1).max(100),
  setupPerformance: z.number().min(1).max(100),
  morale: z.number().min(0).max(100),
  salary: z.number().min(0),
  contractYears: z.number().int().min(0),
  teamId: z.string().nullable(),
});

const upgradeProjectSchema = z.object({
  id: z.string(),
  attribute: z.enum(['topSpeed', 'downforce', 'reliability']),
  racesRemaining: z.number().int().min(0),
  cost: z.number().min(0),
  improvement: z.number().min(0),
  isRetry: z.boolean().optional(),
});

const carSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  topSpeed: z.number().min(1).max(100),
  downforce: z.number().min(1).max(100),
  reliability: z.number().min(0).max(100),
  upgradesInProgress: z.array(upgradeProjectSchema),
});

const circuitSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  round: z.number().int().min(1).max(24),
  laps: z.number().int().min(1),
  topSpeedDemand: z.number().min(0).max(1),
  downforceDemand: z.number().min(0).max(1),
  reliabilityDemand: z.number().min(0).max(1),
});

const qualyResultEntrySchema = z.object({
  driverId: z.string(),
  teamId: z.string(),
  position: z.number().int().min(1).max(20),
  lapTimeSeconds: z.number(),
  timeGap: z.string(),
  hasIncident: z.boolean().optional(),
  incidentReason: z.string().optional(),
});

const raceResultEntrySchema = z.object({
  driverId: z.string(),
  teamId: z.string(),
  gridPosition: z.number().int().min(1).max(20),
  finishPosition: z.number().int().min(1).max(20),
  points: z.number().min(0),
  isDnf: z.boolean(),
  dnfReason: z.enum(['Fallo mecánico', 'Accidente']).optional(),
  timeGap: z.string(),
});

const raceFinancialsSchema = z.object({
  baseSponsorIncome: z.number(),
  bonusSponsorIncome: z.number(),
  bonusAchieved: z.boolean(),
  salariesCost: z.number(),
  maintenanceCost: z.number(),
  dnfRepairCost: z.number(),
  netIncome: z.number(),
});

const raceWeekendResultSchema = z.object({
  round: z.number().int().min(1).max(24),
  circuitId: z.string(),
  qualyResults: z.array(qualyResultEntrySchema),
  raceResults: z.array(raceResultEntrySchema),
  playerFinancials: raceFinancialsSchema.optional(),
});

const gameUpgradeDeliverySummarySchema = z.object({
  projectId: z.string(),
  attribute: z.enum(['topSpeed', 'downforce', 'reliability']),
  success: z.boolean(),
  improvement: z.number(),
  message: z.string(),
});

const teamPrincipalOfferSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  reputation: z.number(),
  budget: z.number(),
  targetConstructorsPosition: z.number(),
  isCurrentTeam: z.boolean(),
  isRescueOffer: z.boolean(),
  message: z.string(),
});

const seasonTransitionSummarySchema = z.object({
  seasonNumber: z.number().int(),
  constructorChampionTeamId: z.string(),
  driverChampionDriverId: z.string(),
  playerConstructorPosition: z.number().int(),
  playerTargetPosition: z.number().int(),
  playerTargetMet: z.boolean(),
  playerIsDismissed: z.boolean(),
  previousTpRating: z.number(),
  newTpRating: z.number(),
  tpRatingDelta: z.number(),
  fiaPrizeEarned: z.number(),
  availableOffers: z.array(teamPrincipalOfferSchema),
  isGameOverDismissal: z.boolean(),
  isCareerCompleted: z.boolean(),
});

export const gameStateSchema = z.object({
  managerProfile: managerProfileSchema,
  playerTeamId: z.string(),
  season: seasonSchema,
  teams: z.array(teamSchema),
  drivers: z.array(driverSchema),
  chiefEngineers: z.array(chiefEngineerSchema),
  cars: z.array(carSchema),
  circuits: z.array(circuitSchema),
  youthDrivers: z.array(youthDriverSchema),
  lastRaceResult: raceWeekendResultSchema.nullable(),
  lastUpgradeResults: z.array(gameUpgradeDeliverySummarySchema).optional(),
  failedUpgradesToRetry: z.array(z.enum(['topSpeed', 'downforce', 'reliability'])).optional(),
  isBankrupt: z.boolean().optional(),
  bankruptcyDetails: z.object({
    debt: z.number(),
    maxAllowedDebt: z.number(),
  }).optional(),
  isGameOver: z.boolean().optional(),
  gameOverReason: z.enum(['bankruptcy', 'dismissal_no_offers']).optional(),
  isCareerCompleted: z.boolean().optional(),
  seasonTransitionSummary: seasonTransitionSummarySchema.optional(),
  updatedAt: z.string(),
});

export const saveGameSchema = z.object({
  version: z.string().min(1),
  exportedAt: z.string(),
  data: gameStateSchema,
});

export type ExportSaveFile = z.infer<typeof saveGameSchema>;

export interface SaveValidationResult {
  success: boolean;
  data?: GameState;
  error?: string;
}

export function serializeGameState(state: GameState): string {
  const payload: ExportSaveFile = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(payload, null, 2);
}

export function validateAndParseSaveGame(rawJson: string): SaveValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return {
      success: false,
      error: 'Archivo de guardado no válido: el archivo no contiene un formato JSON legible',
    };
  }

  const result = saveGameSchema.safeParse(parsed);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .slice(0, 3)
      .join(' | ');

    return {
      success: false,
      error: `Archivo de guardado no válido: estructura o datos corruptos (${errorDetails})`,
    };
  }

  return {
    success: true,
    data: result.data.data as GameState,
  };
}
