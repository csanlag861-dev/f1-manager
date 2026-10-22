import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useGameStore } from '@/application/store/gameStore';
import { storageAdapter } from '@/infrastructure/storage/indexedDbAdapter';
import { simulateQualySession, simulateRaceSession, createDeterministicRng } from '@/domain/simulation';

describe('Tarea 1.6: Flujo Completo del Fin de Semana de Carreras Básico (AC-06.1, AC-06.6, AC-06.7)', () => {
  beforeEach(async () => {
    await storageAdapter.clearGameState();
    useGameStore.setState({ gameState: null });
  });

  it('debe disputar el Gran Premio 1 completo, asignar puntos, avanzar a la Ronda 2 y persistir en IndexedDB', async () => {
    // 1. Initialize game with Ferrari
    const store = useGameStore.getState();
    await store.initGame('ferrari', 'Fred Vasseur');

    const state = useGameStore.getState().gameState!;
    expect(state.season.currentRaceIndex).toBe(0); // Round 1
    const circuit1 = state.circuits[state.season.currentRaceIndex];
    expect(circuit1.round).toBe(1);
    expect(circuit1.name).toBe('Gran Premio de Baréin');

    // 2. Qualy simulation
    const rngQualy = createDeterministicRng(100);
    const qualyResults = simulateQualySession(
      state.drivers,
      state.teams,
      state.cars,
      state.chiefEngineers,
      circuit1,
      undefined,
      rngQualy
    );
    expect(qualyResults).toHaveLength(20);
    expect(qualyResults[0].position).toBe(1);

    // 3. Race simulation
    const rngRace = createDeterministicRng(200);
    const raceResults = simulateRaceSession(
      qualyResults,
      state.drivers,
      state.teams,
      state.cars,
      state.chiefEngineers,
      circuit1,
      undefined,
      rngRace
    );
    expect(raceResults).toHaveLength(20);
    expect(raceResults[0].finishPosition).toBe(1);
    expect(raceResults[0].points).toBe(25);

    // 4. Register race result
    const weekendResult = {
      round: circuit1.round,
      circuitId: circuit1.id,
      qualyResults,
      raceResults,
      playerFinancials: {
        baseSponsorIncome: 2400000,
        bonusSponsorIncome: 0,
        bonusAchieved: false,
        salariesCost: 0,
        maintenanceCost: 0,
        dnfRepairCost: 0,
        netIncome: 2400000,
      },
    };

    await store.applyRaceResults(weekendResult);

    // Verify standings were updated
    const afterRaceState = useGameStore.getState().gameState!;
    const topScorer = afterRaceState.season.driverStandings[0];
    expect(topScorer.points).toBe(25);

    // 5. Advance to next round (Ronda 1 -> Ronda 2)
    await store.advanceToNextRound();

    const nextRoundState = useGameStore.getState().gameState!;
    expect(nextRoundState.season.currentRaceIndex).toBe(1); // Round 2 (GP de Arabia Saudí)
    expect(nextRoundState.circuits[nextRoundState.season.currentRaceIndex].name).toBe('Gran Premio de Arabia Saudí');

    // 6. Simulate page refresh / tab reload by clearing store in-memory and reloading from IndexedDB
    useGameStore.setState({ gameState: null });
    expect(useGameStore.getState().gameState).toBeNull();

    const reloadedState = await useGameStore.getState().loadGame();
    expect(reloadedState).not.toBeNull();
    expect(reloadedState?.season.currentRaceIndex).toBe(1);
    expect(reloadedState?.playerTeamId).toBe('ferrari');
    expect(reloadedState?.circuits[reloadedState.season.currentRaceIndex].round).toBe(2);
    expect(reloadedState?.season.driverStandings[0].points).toBe(25);
  });
});
