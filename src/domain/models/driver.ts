export interface Driver {
  id: string;
  name: string;
  age: number;
  nationality: string;
  pace: number; // 1-100
  consistency: number; // 1-100
  potential: number; // 1-100
  morale: number; // 0-100
  salary: number; // annual salary in USD
  contractYears: number;
  teamId: string | null;
}

export interface YouthDriver {
  id: string;
  name: string;
  age: number;
  nationality: string;
  pace: number;
  consistency: number;
  potential: number;
  morale: number;
  teamId: string | null;
}
