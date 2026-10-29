import { ManagerProfile } from './manager';
import { Season } from './season';
import { Team } from './team';
import { Driver, YouthDriver } from './driver';
import { ChiefEngineer } from './engineer';
import { Car, CarAttribute } from './car';
import { Circuit } from './circuit';
import { RaceWeekendResult } from './race';

export interface GameUpgradeDeliverySummary {
  projectId: string;
  attribute: CarAttribute;
  success: boolean;
  improvement: number;
  message: string;
}

export interface TeamPrincipalOffer {
  teamId: string;
  teamName: string;
  reputation: number;
  budget: number;
  targetConstructorsPosition: number;
  isCurrentTeam: boolean;
  isRescueOffer: boolean;
  message: string;
}

export interface SeasonTransitionSummary {
  seasonNumber: number;
  constructorChampionTeamId: string;
  driverChampionDriverId: string;
  playerConstructorPosition: number;
  playerTargetPosition: number;
  playerTargetMet: boolean;
  playerIsDismissed: boolean;
  previousTpRating: number;
  newTpRating: number;
  tpRatingDelta: number;
  fiaPrizeEarned: number;
  availableOffers: TeamPrincipalOffer[];
  isGameOverDismissal: boolean;
  isCareerCompleted: boolean;
}

export interface GameState {
  managerProfile: ManagerProfile;
  playerTeamId: string;
  season: Season;
  teams: Team[];
  drivers: Driver[];
  chiefEngineers: ChiefEngineer[];
  cars: Car[];
  circuits: Circuit[];
  youthDrivers: YouthDriver[];
  lastRaceResult: RaceWeekendResult | null;
  lastUpgradeResults?: GameUpgradeDeliverySummary[];
  failedUpgradesToRetry?: CarAttribute[];
  isBankrupt?: boolean;
  bankruptcyDetails?: {
    debt: number;
    maxAllowedDebt: number;
  };
  isGameOver?: boolean;
  gameOverReason?: 'bankruptcy' | 'dismissal_no_offers';
  isCareerCompleted?: boolean;
  seasonTransitionSummary?: SeasonTransitionSummary;
  updatedAt: string;
}

