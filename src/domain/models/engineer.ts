export interface ChiefEngineer {
  id: string;
  name: string;
  developmentEfficiency: number; // 1-100
  setupPerformance: number; // 1-100
  morale: number; // 0-100
  salary: number; // annual salary in USD
  contractYears: number;
  teamId: string | null;
}
