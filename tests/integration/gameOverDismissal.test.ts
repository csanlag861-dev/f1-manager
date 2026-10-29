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

describe('Tarea 7.4: Condición de Game Over por Destitución sin Ofertas (AC-08.5)', () => {
  let mockAdapter: MockStorageAdapter;

  beforeEach(() => {
    mockAdapter = new MockStorageAdapter();
    useGameStore.setState({ gameState: null, isLoading: false, isSaving: false, error: null });
  });

  it('activa el estado de derrota definitiva (Game Over) cuando el jugador es despedido y su rating es insuficiente para cualquier oferta', async () => {
    const store = useGameStore.getState();
    await store.initGame('haas', 'Desafortunado Director', mockAdapter);

    const currentState = useGameStore.getState().gameState!;
    // Set minimal rating (e.g. 15), target is 10th but Haas finishes with 0 points and huge deficit
    // or let's say target was 5th and finished 10th with rating 20 -> 20 - 20 = 0 rating
    const updatedStandings = currentState.season.constructorStandings.map((cs) => {
      if (cs.teamId === 'haas') {
        return { ...cs, points: 0, wins: 0, podiums: 0 };
      }
      return { ...cs, points: 100, wins: 1, podiums: 2 };
    });

    useGameStore.setState({
      gameState: {
        ...currentState,
        teams: currentState.teams.map((t) =>
          t.id === 'haas'
            ? { ...t, boardExpectations: { targetConstructorsPosition: 5, description: 'Top 5' } }
            : t
        ),
        managerProfile: {
          ...currentState.managerProfile,
          tpRating: 20, // Low rating that will be wiped out
        },
        season: {
          ...currentState.season,
          constructorStandings: updatedStandings,
        },
      },
    });

    const summary = await useGameStore.getState().processSeasonEnd(mockAdapter);

    expect(summary).not.toBeNull();
    expect(summary?.playerIsDismissed).toBe(true);
    expect(summary?.newTpRating).toBe(0);
    // No team accepts rating 0 (min required by lowest team is 35)
    expect(summary?.availableOffers).toHaveLength(0);
    expect(summary?.isGameOverDismissal).toBe(true);

    const afterState = useGameStore.getState().gameState!;
    expect(afterState.isGameOver).toBe(true);
    expect(afterState.gameOverReason).toBe('dismissal_no_offers');

    // Attempting to advance round or start next season should be blocked
    await expect(useGameStore.getState().advanceToNextRound(mockAdapter)).rejects.toThrow(
      /Game Over/i
    );
    await expect(useGameStore.getState().startNextSeason(mockAdapter)).rejects.toThrow(
      /Game Over/i
    );
  });
});
