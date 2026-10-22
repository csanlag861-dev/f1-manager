import { describe, it, expect } from 'vitest';
import {
  INITIAL_TEAMS,
  INITIAL_DRIVERS,
  INITIAL_CHIEF_ENGINEERS,
  INITIAL_CARS,
  OFFICIAL_CIRCUITS,
  createInitialGameState,
} from '@/config/initialTeamsData';

describe('Tarea 1.2: Catálogo Inicial de Dominio (AC-01.1)', () => {
  it('debe contener exactamente 10 escuderías oficiales con todos sus atributos', () => {
    expect(INITIAL_TEAMS).toHaveLength(10);

    for (const team of INITIAL_TEAMS) {
      expect(team.id).toBeDefined();
      expect(team.name).toBeTruthy();
      expect(team.budget).toBeGreaterThan(0);
      expect(team.baseBudget).toBeGreaterThan(0);
      expect(team.baseBudget).toBe(team.budget);
      expect(team.boardExpectations).toBeDefined();
      expect(team.boardExpectations.targetConstructorsPosition).toBeGreaterThanOrEqual(1);
      expect(team.boardExpectations.targetConstructorsPosition).toBeLessThanOrEqual(10);
      expect(team.reputation).toBeGreaterThanOrEqual(1);
      expect(team.reputation).toBeLessThanOrEqual(100);
      expect(team.factoryLevel).toBeGreaterThanOrEqual(1);
      expect(team.simulatorLevel).toBeGreaterThanOrEqual(1);
      expect(team.carId).toBeTruthy();
      expect(team.driverIds).toHaveLength(2);
      expect(team.chiefEngineerId).toBeTruthy();
      expect(team.sponsor).toBeDefined();
      expect(team.sponsor.baseIncomePerRace).toBeGreaterThan(0);
    }
  });

  it('debe contener exactamente 20 pilotos titulares con todos sus atributos requeridos', () => {
    expect(INITIAL_DRIVERS).toHaveLength(20);

    for (const driver of INITIAL_DRIVERS) {
      expect(driver.id).toBeTruthy();
      expect(driver.name).toBeTruthy();
      expect(driver.age).toBeGreaterThanOrEqual(18);
      expect(driver.nationality).toBeTruthy();
      expect(driver.pace).toBeGreaterThanOrEqual(1);
      expect(driver.pace).toBeLessThanOrEqual(100);
      expect(driver.consistency).toBeGreaterThanOrEqual(1);
      expect(driver.consistency).toBeLessThanOrEqual(100);
      expect(driver.potential).toBeGreaterThanOrEqual(1);
      expect(driver.potential).toBeLessThanOrEqual(100);
      expect(driver.morale).toBeGreaterThanOrEqual(0);
      expect(driver.morale).toBeLessThanOrEqual(100);
      expect(driver.salary).toBeGreaterThan(0);
      expect(driver.contractYears).toBeGreaterThanOrEqual(1);
      expect(driver.teamId).toBeTruthy();
    }
  });

  it('debe contener exactamente 24 circuitos oficiales con todos sus atributos', () => {
    expect(OFFICIAL_CIRCUITS).toHaveLength(24);

    for (let i = 0; i < OFFICIAL_CIRCUITS.length; i++) {
      const circuit = OFFICIAL_CIRCUITS[i];
      expect(circuit.id).toBeTruthy();
      expect(circuit.name).toBeTruthy();
      expect(circuit.country).toBeTruthy();
      expect(circuit.round).toBe(i + 1);
      expect(circuit.laps).toBeGreaterThan(0);
      expect(circuit.topSpeedDemand).toBeGreaterThanOrEqual(0);
      expect(circuit.topSpeedDemand).toBeLessThanOrEqual(1);
      expect(circuit.downforceDemand).toBeGreaterThanOrEqual(0);
      expect(circuit.downforceDemand).toBeLessThanOrEqual(1);
      expect(circuit.reliabilityDemand).toBeGreaterThanOrEqual(0);
      expect(circuit.reliabilityDemand).toBeLessThanOrEqual(1);
    }
  });

  it('debe inicializar un GameState completo y consistente al seleccionar una escudería', () => {
    const gameState = createInitialGameState('ferrari', 'Scuderia Boss');
    expect(gameState.playerTeamId).toBe('ferrari');
    expect(gameState.managerProfile.name).toBe('Scuderia Boss');
    expect(gameState.managerProfile.tpRating).toBe(96);
    expect(gameState.season.seasonNumber).toBe(1);
    expect(gameState.season.currentRaceIndex).toBe(0);
    expect(gameState.teams).toHaveLength(10);
    expect(gameState.drivers).toHaveLength(20);
    expect(gameState.chiefEngineers).toHaveLength(10);
    expect(gameState.cars).toHaveLength(10);
    expect(gameState.circuits).toHaveLength(24);
    expect(gameState.season.driverStandings).toHaveLength(20);
    expect(gameState.season.constructorStandings).toHaveLength(10);
  });
});
