export interface TrophyCabinet {
  driversChampionships: number;
  constructorsChampionships: number;
  totalWins: number;
  totalPodiums: number;
}

export interface ManagerProfile {
  id: string;
  name: string;
  tpRating: number; // 0 to 100
  seasonsCompleted: number;
  trophyCabinet: TrophyCabinet;
}
