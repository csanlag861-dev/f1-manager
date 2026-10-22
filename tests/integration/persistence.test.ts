import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { storageAdapter } from '@/infrastructure/storage/indexedDbAdapter';
import { useGameStore } from '@/application/store/gameStore';

describe('Tarea 1.4: Capa de Persistencia Local y Store Global (AC-09.1, AC-09.2)', () => {
  beforeEach(async () => {
    await storageAdapter.clearGameState();
    useGameStore.setState({ gameState: null, isLoading: false, isSaving: false, error: null });
  });

  it('debe persistir el estado inicial en IndexedDB y recargarlo con paridad de datos íntegra', async () => {
    // 1. Initialize game through store
    const store = useGameStore.getState();
    const createdState = await store.initGame('ferrari', 'Maurizio Arrivabene');

    expect(createdState.playerTeamId).toBe('ferrari');
    expect(createdState.managerProfile.name).toBe('Maurizio Arrivabene');

    // 2. Directly verify data in IndexedDB via adapter
    const loadedDirectly = await storageAdapter.loadGameState();
    expect(loadedDirectly).not.toBeNull();
    expect(loadedDirectly?.playerTeamId).toBe('ferrari');
    expect(loadedDirectly?.managerProfile.name).toBe('Maurizio Arrivabene');
    expect(loadedDirectly?.teams).toHaveLength(10);
    expect(loadedDirectly?.drivers).toHaveLength(20);
    expect(loadedDirectly?.circuits).toHaveLength(24);

    // 3. Reset in-memory store to simulate app restart / tab close
    useGameStore.setState({ gameState: null });
    expect(useGameStore.getState().gameState).toBeNull();

    // 4. Reload from storage into store
    const reloaded = await useGameStore.getState().loadGame();
    expect(reloaded).not.toBeNull();
    expect(reloaded?.playerTeamId).toBe('ferrari');
    expect(reloaded?.managerProfile.tpRating).toBe(96);
    expect(useGameStore.getState().gameState?.playerTeamId).toBe('ferrari');
  });

  it('debe avanzar de ronda y persistir automáticamente el nuevo índice de carrera', async () => {
    const store = useGameStore.getState();
    await store.initGame('mclaren', 'Andrea Stella');

    expect(useGameStore.getState().gameState?.season.currentRaceIndex).toBe(0);

    // Advance round (Ronda 1 -> Ronda 2)
    await useGameStore.getState().advanceToNextRound();

    expect(useGameStore.getState().gameState?.season.currentRaceIndex).toBe(1);

    // Verify persisted in IndexedDB
    const fromDb = await storageAdapter.loadGameState();
    expect(fromDb?.season.currentRaceIndex).toBe(1);
    expect(fromDb?.playerTeamId).toBe('mclaren');
  });

  it('debe actualizar los standings y guardarlos tras disputar un Gran Premio', async () => {
    const store = useGameStore.getState();
    await store.initGame('red-bull', 'Christian Horner');

    const mockRaceResult = {
      round: 1,
      circuitId: 'c-01',
      qualyResults: [
        { driverId: 'verstappen', teamId: 'red-bull', position: 1, lapTimeSeconds: 88.5, timeGap: 'POLE' },
      ],
      raceResults: [
        { driverId: 'verstappen', teamId: 'red-bull', gridPosition: 1, finishPosition: 1, points: 25, isDnf: false, timeGap: 'WINNER' },
        { driverId: 'norris', teamId: 'mclaren', gridPosition: 2, finishPosition: 2, points: 18, isDnf: false, timeGap: '+2.140s' },
      ],
    };

    await useGameStore.getState().applyRaceResults(mockRaceResult);

    const updatedState = useGameStore.getState().gameState;
    const verstappenStanding = updatedState?.season.driverStandings.find((s) => s.driverId === 'verstappen');
    expect(verstappenStanding?.points).toBe(25);
    expect(verstappenStanding?.wins).toBe(1);

    const redBullStanding = updatedState?.season.constructorStandings.find((s) => s.teamId === 'red-bull');
    expect(redBullStanding?.points).toBe(25);

    // Verify IndexedDB reflection
    const fromDb = await storageAdapter.loadGameState();
    const dbVerstappen = fromDb?.season.driverStandings.find((s) => s.driverId === 'verstappen');
    expect(dbVerstappen?.points).toBe(25);
  });
});
