import { describe, it, expect } from 'vitest';
import { simulateQualySession, evaluateQualyIncident } from '@/domain/simulation/qualyEngine';
import { Driver, Car, Circuit } from '@/domain/models';
import { defaultSimulationConfig } from '@/config/simulationConfig';

describe('Tarea 2.3: Incidentes en Sesión de Clasificación (AC-06.2)', () => {
  const circuit: Circuit = {
    id: 'test-circuit',
    name: 'Monaco GP',
    country: 'Monaco',
    round: 8,
    laps: 78,
    topSpeedDemand: 0.1,
    downforceDemand: 1.0,
    reliabilityDemand: 0.6,
  };

  it('debe evaluar correctamente la probabilidad de incidente según consistencia y fiabilidad', () => {
    const fragileCar: Car = { id: 'c-fragile', teamId: 't1', topSpeed: 80, downforce: 80, reliability: 10, upgradesInProgress: [] };
    const errorProneDriver: Driver = { id: 'd-fragile', name: 'Rookie', age: 19, nationality: 'US', pace: 70, consistency: 10, potential: 70, morale: 50, salary: 1, contractYears: 1, teamId: 't1' };

    const fixedRngIncident = () => 0.0001; // Force incident
    const res = evaluateQualyIncident(fragileCar, errorProneDriver, defaultSimulationConfig, fixedRngIncident);
    expect(res.hasIncident).toBe(true);
    expect(res.incidentReason).toBeDefined();

    const fixedRngNoIncident = () => 0.9999; // Clean lap
    const resClean = evaluateQualyIncident(fragileCar, errorProneDriver, defaultSimulationConfig, fixedRngNoIncident);
    expect(resClean.hasIncident).toBe(false);
  });

  it('debe reubicar al piloto afectado por un incidente en Qualy automáticamente al fondo de la parrilla (puestos 18-20)', () => {
    // 20 drivers
    const drivers: Driver[] = Array.from({ length: 20 }, (_, i) => ({
      id: `driver-${i + 1}`,
      name: `Driver ${i + 1}`,
      age: 25,
      nationality: 'ES',
      pace: 95 - i, // driver-1 has pace 95 (pole candidate)
      consistency: 90,
      potential: 90,
      morale: 80,
      salary: 1000000,
      contractYears: 2,
      teamId: `team-${Math.floor(i / 2) + 1}`,
    }));

    const cars: Car[] = Array.from({ length: 10 }, (_, i) => ({
      id: `car-${i + 1}`,
      teamId: `team-${i + 1}`,
      topSpeed: 90,
      downforce: 90,
      reliability: 90,
      upgradesInProgress: [],
    }));

    // Target driver-1 (who would otherwise easily get pole) to suffer a Qualy incident
    let callCount = 0;
    const targetedRng = () => {
      callCount++;
      // First driver evaluation triggers incident (< 0.001), rest do not
      if (callCount === 1) return 0.00001;
      return 0.5; // clean
    };

    const results = simulateQualySession(drivers, [], cars, [], circuit, defaultSimulationConfig, targetedRng);

    expect(results).toHaveLength(20);

    const affectedEntry = results.find((r) => r.driverId === 'driver-1');
    expect(affectedEntry).toBeDefined();
    expect(affectedEntry?.hasIncident).toBe(true);

    // Relegated to the back of the grid (puesto 20 because only 1 incident occurred)
    expect(affectedEntry?.position).toBe(20);
    expect(affectedEntry?.timeGap).toContain('(Incidente)');

    // The other 19 drivers should occupy positions 1 to 19 without incident
    const cleanEntries = results.filter((r) => !r.hasIncident);
    expect(cleanEntries).toHaveLength(19);
    for (let i = 0; i < 19; i++) {
      expect(cleanEntries[i].position).toBe(i + 1);
    }
  });
});
