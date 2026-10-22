import { ManagerProfile } from './manager';
import { Season } from './season';
import { Team } from './team';
import { Driver, YouthDriver } from './driver';
import { ChiefEngineer } from './engineer';
import { Car } from './car';
import { Circuit } from './circuit';
import { RaceWeekendResult } from './race';

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
  isBankrupt?: boolean;
  bankruptcyDetails?: {
    debt: number;
    maxAllowedDebt: number;
  };
  updatedAt: string;
}
