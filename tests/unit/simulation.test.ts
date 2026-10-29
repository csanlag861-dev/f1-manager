import { describe, it, expect } from 'vitest';
import {
  INITIAL_TEAMS,
  INITIAL_DRIVERS,
  INITIAL_CHIEF_ENGINEERS,
  INITIAL_CARS,
  OFFICIAL_CIRCUITS,
} from '@/config/initialTeamsData';
import {
  simulateQualySession,
  simulateRaceSession,
  createDeterministicRng,
} from '@/domain/simulation';
import { defaultSimulationConfig } from '@/config/simulationConfig';

describe('Tarea 1.3: Motor Básico de Simulación (AC-06.1, AC-06.6)', () => {
  const circuit = OFFICIAL_CIRCUITS[0]; // Sakhir

  it('debe simular una sesión de Qualy generando exactamente 20 posiciones deterministas', () => {
    const rng1 = createDeterministicRng(42);
    const qualyResults1 = simulateQualySession(
      INITIAL_DRIVERS,
      INITIAL_TEAMS,
      INITIAL_CARS,
      INITIAL_CHIEF_ENGINEERS,
      circuit,
      defaultSimulationConfig,
      rng1
    );

    expect(qualyResults1).toHaveLength(20);

    // Positions from 1 to 20 without duplicates
    const positions = qualyResults1.map((r) => r.position);
    expect(positions).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));

    // Pole position check
    expect(qualyResults1[0].position).toBe(1);
    expect(qualyResults1[0].timeGap).toBe('POLE');

    // Reproducibility test with the same seed
    const rng2 = createDeterministicRng(42);
    const qualyResults2 = simulateQualySession(
      INITIAL_DRIVERS,
      INITIAL_TEAMS,
      INITIAL_CARS,
      INITIAL_CHIEF_ENGINEERS,
      circuit,
      defaultSimulationConfig,
      rng2
    );

    expect(qualyResults1).toEqual(qualyResults2);
  });

  it('debe reflejar coherencia estadística donde equipos y pilotos top clasifican arriba en Qualy', () => {
    // Run with 0 noise and 0 incident factor to verify pure stat ranking
    const zeroNoiseConfig = { ...defaultSimulationConfig, qualyRandomSigma: 0, qualyIncidentFactor: 0 };
    const qualyResults = simulateQualySession(
      INITIAL_DRIVERS,
      INITIAL_TEAMS,
      INITIAL_CARS,
      INITIAL_CHIEF_ENGINEERS,
      circuit,
      zeroNoiseConfig
    );

    // Top teams (Red Bull, Ferrari, McLaren) should occupy top positions
    const top4Drivers = qualyResults.slice(0, 4).map((r) => r.driverId);
    expect(top4Drivers).toContain('verstappen');
    expect(top4Drivers).toContain('leclerc');

    // Lower tier cars should be towards the back
    const bottom5Drivers = qualyResults.slice(15).map((r) => r.driverId);
    expect(
      bottom5Drivers.some((d) => ['bearman', 'ocon', 'bortoleto', 'hadjar', 'doohan'].includes(d))
    ).toBe(true);
  });

  it('debe simular una carrera completa asignando puntos oficiales FIA del 1º al 10º', () => {
    const rngQualy = createDeterministicRng(100);
    const qualyResults = simulateQualySession(
      INITIAL_DRIVERS,
      INITIAL_TEAMS,
      INITIAL_CARS,
      INITIAL_CHIEF_ENGINEERS,
      circuit,
      defaultSimulationConfig,
      rngQualy
    );

    const rngRace = createDeterministicRng(200);
    const raceResults = simulateRaceSession(
      qualyResults,
      INITIAL_DRIVERS,
      INITIAL_TEAMS,
      INITIAL_CARS,
      INITIAL_CHIEF_ENGINEERS,
      circuit,
      defaultSimulationConfig,
      rngRace
    );

    expect(raceResults).toHaveLength(20);

    // Positions from 1 to 20
    const positions = raceResults.map((r) => r.finishPosition);
    expect(positions).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));

    // First place
    expect(raceResults[0].finishPosition).toBe(1);
    expect(raceResults[0].points).toBe(25);
    expect(raceResults[0].timeGap).toBe('WINNER');

    // FIA points for top 10
    const expectedPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    for (let i = 0; i < 10; i++) {
      expect(raceResults[i].points).toBe(expectedPoints[i]);
    }

    // Positions 11 to 20 receive 0 points
    for (let i = 10; i < 20; i++) {
      expect(raceResults[i].points).toBe(0);
    }
  });
});
