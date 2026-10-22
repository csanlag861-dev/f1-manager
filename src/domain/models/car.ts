export type CarAttribute = 'topSpeed' | 'downforce' | 'reliability';

export interface UpgradeProject {
  id: string;
  attribute: CarAttribute;
  racesRemaining: number;
  cost: number;
  improvement: number;
  isRetry?: boolean;
}

export interface Car {
  id: string;
  teamId: string;
  topSpeed: number; // 1-100
  downforce: number; // 1-100
  reliability: number; // 0-1 (e.g. 0.85 = 85%) or 1-100? Let's normalize as 1-100 for display, or 0-1 for math.
  upgradesInProgress: UpgradeProject[];
}
