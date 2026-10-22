import { describe, it, expect } from 'vitest';
import { simulateRaceSession } from '@/domain/simulation/raceEngine';
import { QualyResultEntry, Driver, Car, Circuit, DnfReason } from '@/domain/models';
import { defaultSimulationConfig } from '@/config/simulationConfig';

describe('Tarea 2.2: Etiquetas Tipificadas de DNF en Clasificación Final (AC-06.4)', () => {
  const allowedDnfReasons: DnfReason[] = ['Fallo mecánico', 'Accidente'];

  const circuit: Circuit = {
    id: 'test-circuit',
    name: 'Circuito Test',
    country: 'TestCountry',
    round: 1,
    laps: 50,
    topSpeedDemand: 0.8,
    downforceDemand: 0.5,
    reliabilityDemand: 0.9,
  };

  it('debe asignar exclusivamente etiquetas cortas tipificadas a los pilotos con DNF', () => {
    const qualy: QualyResultEntry[] = Array.from({ length: 20 }, (_, i) => ({
      driverId: `driver-${i + 1}`,
      teamId: `team-${Math.floor(i / 2) + 1}`,
      position: i + 1,
      lapTimeSeconds: 80 + i * 0.1,
      timeGap: i === 0 ? 'POLE' : `+${(i * 0.1).toFixed(3)}s`,
    }));

    const drivers: Driver[] = Array.from({ length: 20 }, (_, i) => ({
      id: `driver-${i + 1}`,
      name: `Piloto ${i + 1}`,
      age: 25,
      nationality: 'ES',
      pace: 80,
      consistency: i % 2 === 0 ? 30 : 90, // alternating low and high consistency
      potential: 80,
      morale: 80,
      salary: 1000000,
      contractYears: 2,
      teamId: `team-${Math.floor(i / 2) + 1}`,
    }));

    const cars: Car[] = Array.from({ length: 10 }, (_, i) => ({
      id: `car-${i + 1}`,
      teamId: `team-${i + 1}`,
      topSpeed: 80,
      downforce: 80,
      reliability: i % 2 === 0 ? 30 : 90, // alternating fragile and reliable cars
      upgradesInProgress: [],
    }));

    // Run multiple simulations to gather a large sample of DNFs
    for (let sim = 0; sim < 50; sim++) {
      const results = simulateRaceSession(qualy, drivers, [], cars, [], circuit, defaultSimulationConfig);

      for (const entry of results) {
        if (entry.isDnf) {
          expect(entry.dnfReason).toBeDefined();
          expect(allowedDnfReasons).toContain(entry.dnfReason);
          // Check that no circumstantial or lengthy text is used
          expect(entry.dnfReason).not.toMatch(/motor roto|trompo|frenos|lluvia|pinchazo|choque/i);
          expect(['Fallo mecánico', 'Accidente']).toContain(entry.dnfReason);
          expect(entry.points).toBe(0);
          expect(entry.timeGap).toBe('DNF');
        } else {
          expect(entry.dnfReason).toBeUndefined();
        }
      }
    }
  });
});
