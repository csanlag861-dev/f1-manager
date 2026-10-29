import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/application/store/gameStore';
import { StorageAdapter } from '../../infrastructure/storage/indexedDbAdapter';
import { GameState } from '../../src/domain/models';

class MockStorageAdapter implements StorageAdapter {
  private state: GameState | null = null;
  async saveGameState(state: GameState): Promise<void> {
    this.state = JSON.parse(JSON.stringify(state));
  }
  async loadGameState(): Promise<GameState | null> {
    return this.state ? JSON.parse(JSON.stringify(this.state)) : null;
  }
  async clearGameState(): Promise<void> {
    this.state = null;
  }
}

describe('Tarea 7.5: Límite de 10 Temporadas y Pantalla de Legado (AC-08.6)', () => {
  let mockAdapter: MockStorageAdapter;

  beforeEach(() => {
    mockAdapter = new MockStorageAdapter();
    useGameStore.setState({ gameState: null, isLoading: false, isSaving: false, error: null });
  });

  it('al completar la 10ª temporada, bloquea el avance a la temporada 11, calcula el título honorífico y consolida el legado', async () => {
    const store = useGameStore.getState();
    await store.initGame('mclaren', 'Legend Manager', mockAdapter);

    const currentState = useGameStore.getState().gameState!;

    // Configure game state at Season 10, with 9 previous seasons completed and palmarès
    useGameStore.setState({
      gameState: {
        ...currentState,
        season: {
          ...currentState.season,
          seasonNumber: 10,
          currentRaceIndex: 23, // Last race
          constructorStandings: currentState.season.constructorStandings.map((cs) =>
            cs.teamId === 'mclaren'
              ? { ...cs, points: 500, wins: 14, podiums: 22 }
              : cs
          ),
          driverStandings: currentState.season.driverStandings.map((ds) =>
            ds.driverId === 'norris'
              ? { ...ds, points: 300, wins: 8, podiums: 14 }
              : ds
          ),
        },
        managerProfile: {
          ...currentState.managerProfile,
          seasonsCompleted: 9, // Currently completing season 10
          tpRating: 92,
          trophyCabinet: {
            driversChampionships: 3,
            constructorsChampionships: 3,
            totalWins: 45,
            totalPodiums: 90,
          },
          teamsManaged: ['aston-martin', 'mclaren'],
        },
      },
    });

    const summary = await useGameStore.getState().processSeasonEnd(mockAdapter);
    expect(summary).not.toBeNull();
    expect(summary?.isCareerCompleted).toBe(true);

    const stateAfter10 = useGameStore.getState().gameState!;
    expect(stateAfter10.isCareerCompleted).toBe(true);
    expect(stateAfter10.managerProfile.seasonsCompleted).toBe(10);

    // Trophies should have increased (McLaren won both championships this season)
    expect(stateAfter10.managerProfile.trophyCabinet.constructorsChampionships).toBe(4);
    expect(stateAfter10.managerProfile.trophyCabinet.driversChampionships).toBe(4);
    expect(stateAfter10.managerProfile.trophyCabinet.totalWins).toBe(45 + 8); // norris wins added

    // Honorary title calculated
    expect(stateAfter10.managerProfile.honoraryTitle).toBe('Leyenda Absoluta e Inmortal de la Fórmula 1');

    // Advancing round or starting Season 11 must be blocked
    await expect(useGameStore.getState().startNextSeason(mockAdapter)).rejects.toThrow(
      /10 temporadas/i
    );
    await expect(useGameStore.getState().advanceToNextRound(mockAdapter)).rejects.toThrow(
      /10 temporadas/i
    );
  });
});
