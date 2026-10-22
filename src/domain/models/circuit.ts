export interface Circuit {
  id: string;
  name: string;
  country: string;
  round: number; // 1 to 24
  laps: number;
  topSpeedDemand: number; // 0.0 to 1.0 (normalized weight for circuit characteristics)
  downforceDemand: number; // 0.0 to 1.0
  reliabilityDemand: number; // 0.0 to 1.0
}
