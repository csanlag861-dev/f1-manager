export type DnfReason = 'Fallo mecánico' | 'Accidente';

export interface QualyResultEntry {
  driverId: string;
  teamId: string;
  position: number; // 1-20
  lapTimeSeconds: number;
  timeGap: string; // e.g., "POLE", "+0.142s"
  hasIncident?: boolean;
  incidentReason?: string;
}

export interface RaceResultEntry {
  driverId: string;
  teamId: string;
  gridPosition: number;
  finishPosition: number; // 1-20
  points: number;
  isDnf: boolean;
  dnfReason?: DnfReason;
  timeGap: string; // e.g., "WINNER", "+3.245s", "DNF"
}

export interface RaceFinancials {
  baseSponsorIncome: number;
  bonusSponsorIncome: number;
  bonusAchieved: boolean;
  salariesCost: number;
  maintenanceCost: number;
  dnfRepairCost: number;
  netIncome: number;
}

export interface RaceWeekendResult {
  round: number;
  circuitId: string;
  qualyResults: QualyResultEntry[];
  raceResults: RaceResultEntry[];
  playerFinancials?: RaceFinancials;
}
