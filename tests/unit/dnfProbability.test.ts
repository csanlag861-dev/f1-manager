import { describe, it, expect } from 'vitest';
import { evaluateDriverDnf, calculateDnfProbabilities, simulateRaceSession } from '@/domain/simulation/raceEngine';
import { Car, Driver, Circuit, QualyResultEntry } from '@/domain/models';
import { defaultSimulationConfig } from '@/config/simulationConfig';
import { createDeterministicRng } from '@/domain/simulation/random';

describe('Tarea 2.1: Cálculo Probabilístico de DNF Binario (AC-06.3)', () => {
  const circuit: Circuit = {
    id: 'test-circuit',
    name: 'Circuito Test',
    country: 'TestLand',
    round: 1,
    laps: 50,
    topSpeedDemand: 0.5,
    downforceDemand: 0.5,
    reliabilityDemand: 0.8, // high mechanical stress
  };

  const driver: Driver = {
    id: 'driver-test',
    name: 'Piloto Test',
    age: 25,
    nationality: 'España',
    pace: 85,
    consistency: 85,
    potential: 85,
    morale: 80,
    salary: 5000000,
    contractYears: 2,
    teamId: 'team-test',
  };

  const highReliabilityCar: Car = {
    id: 'car-reliable',
    teamId: 'team-test',
    topSpeed: 85,
    downforce: 85,
    reliability: 95, // 95% reliable
    upgradesInProgress: [],
  };

  const lowReliabilityCar: Car = {
    id: 'car-unreliable',
    teamId: 'team-test',
    topSpeed: 85,
    downforce: 85,
    reliability: 20, // 20% reliable (fragile)
    upgradesInProgress: [],
  };

  it('debe calcular probabilidades matemáticas de DNF acordes a la fórmula', () => {
    const probHigh = calculateDnfProbabilities(highReliabilityCar, driver, circuit, defaultSimulationConfig);
    const probLow = calculateDnfProbabilities(lowReliabilityCar, driver, circuit, defaultSimulationConfig);

    expect(probLow.probMech).toBeGreaterThan(probHigh.probMech);
    expect(probLow.totalProb).toBeGreaterThan(probHigh.totalProb);
  });

  it('debe demostrar estadísticamente en 1.000 simulaciones que baja fiabilidad genera significativamente más abandonos', () => {
    const SIMULATIONS = 1000;
    const rng = createDeterministicRng(42);

    let highRelDnfs = 0;
    let lowRelDnfs = 0;

    for (let i = 0; i < SIMULATIONS; i++) {
      const resHigh = evaluateDriverDnf(highReliabilityCar, driver, circuit, defaultSimulationConfig, rng);
      if (resHigh.isDnf) highRelDnfs++;

      const resLow = evaluateDriverDnf(lowReliabilityCar, driver, circuit, defaultSimulationConfig, rng);
      if (resLow.isDnf) lowRelDnfs++;
    }

    // A car with 20% reliability should suffer far more DNFs than a 95% reliable car
    expect(lowRelDnfs).toBeGreaterThan(highRelDnfs * 3);
    expect(lowRelDnfs).toBeGreaterThan(30); // at least ~3-5%
  });

  it('debe marcar a los pilotos con DNF como no clasificados (0 puntos)', () => {
    const qualy: QualyResultEntry[] = [
      { driverId: 'd1', teamId: 't1', position: 1, lapTimeSeconds: 80, timeGap: 'POLE' },
      { driverId: 'd2', teamId: 't2', position: 2, lapTimeSeconds: 80.2, timeGap: '+0.200s' },
    ];

    const drivers: Driver[] = [
      { id: 'd1', name: 'D1', age: 25, nationality: 'ES', pace: 90, consistency: 90, potential: 90, morale: 80, salary: 1, contractYears: 1, teamId: 't1' },
      { id: 'd2', name: 'D2', age: 25, nationality: 'IT', pace: 90, consistency: 90, potential: 90, morale: 80, salary: 1, contractYears: 1, teamId: 't2' },
    ];

    const cars: Car[] = [
      { id: 'c1', teamId: 't1', topSpeed: 90, downforce: 90, reliability: 95, upgradesInProgress: [] },
      { id: 'c2', teamId: 't2', topSpeed: 90, downforce: 90, reliability: 0, upgradesInProgress: [] }, // Guaranteed high DNF chance
    ];

    // Force rng so d2 gets DNF
    // If rng returns 0.001 for d2, d2 will DNF
    let callCount = 0;
    const fixedRng = () => {
      callCount++;
      return callCount === 1 ? 0.99 : 0.0001; // d1 finishes, d2 DNFs
    };

    const results = simulateRaceSession(qualy, drivers, [], cars, [], circuit, defaultSimulationConfig, fixedRng);

    const dnfDriver = results.find((r) => r.isDnf);
    expect(dnfDriver).toBeDefined();
    expect(dnfDriver?.points).toBe(0);
    expect(dnfDriver?.timeGap).toBe('DNF');
  });
});
