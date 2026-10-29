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

describe('Tarea 7.3: Mercado de Team Principal (Ofertas y Rescate) (AC-08.3, AC-08.4)', () => {
  let mockAdapter: MockStorageAdapter;

  beforeEach(() => {
    mockAdapter = new MockStorageAdapter();
    useGameStore.setState({ gameState: null, isLoading: false, isSaving: false, error: null });
  });

  it('un jugador con tpRating alto que cumple objetivos recibe oferta de renovación y ofertas formales de escuderías punteras (AC-08.3)', async () => {
    const store = useGameStore.getState();
    await store.initGame('aston-martin', 'Fernando Director', mockAdapter);

    // Set Aston Martin target to 5th, and standings having Aston Martin 2nd
    const currentState = useGameStore.getState().gameState!;
    const updatedStandings = currentState.season.constructorStandings.map((cs) => {
      if (cs.teamId === 'aston-martin') {
        return { ...cs, points: 350, wins: 5, podiums: 15 };
      }
      return cs;
    });

    useGameStore.setState({
      gameState: {
        ...currentState,
        managerProfile: {
          ...currentState.managerProfile,
          tpRating: 85, // High rating
        },
        season: {
          ...currentState.season,
          constructorStandings: updatedStandings,
        },
      },
    });

    const summary = await useGameStore.getState().processSeasonEnd(mockAdapter);
    expect(summary).not.toBeNull();
    expect(summary?.playerIsDismissed).toBe(false);
    expect(summary?.playerTargetMet).toBe(true);

    // Offers should include current team renewal
    const currentTeamOffer = summary?.availableOffers.find((o) => o.teamId === 'aston-martin');
    expect(currentTeamOffer).toBeDefined();
    expect(currentTeamOffer?.isCurrentTeam).toBe(true);
    expect(currentTeamOffer?.isRescueOffer).toBe(false);

    // Offers should also include top teams (e.g., Ferrari, Mercedes, McLaren) because tpRating is high (>= 80)
    const otherOffers = summary?.availableOffers.filter((o) => !o.isCurrentTeam) ?? [];
    expect(otherOffers.length).toBeGreaterThan(0);
    const hasTopTier = otherOffers.some((o) => o.reputation >= 90);
    expect(hasTopTier).toBe(true);
  });

  it('un jugador despedido con tpRating medio recibe ofertas de rescate de equipos de la zona baja/media y puede elegir nuevo equipo (AC-08.4)', async () => {
    const store = useGameStore.getState();
    // Start at Ferrari (Target: 1st)
    await store.initGame('ferrari', 'Despedido Director', mockAdapter);

    const currentState = useGameStore.getState().gameState!;
    // Ferrari finishes 6th (deficit 5 positions -> dismissed)
    const updatedStandings = currentState.season.constructorStandings.map((cs) => {
      if (cs.teamId === 'ferrari') {
        return { ...cs, points: 50, wins: 0, podiums: 0 };
      }
      return { ...cs, points: 200, wins: 2, podiums: 4 };
    });

    useGameStore.setState({
      gameState: {
        ...currentState,
        managerProfile: {
          ...currentState.managerProfile,
          tpRating: 65, // Medium rating
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

    // Current team (Ferrari) must NOT offer contract
    const ferrariOffer = summary?.availableOffers.find((o) => o.teamId === 'ferrari');
    expect(ferrariOffer).toBeUndefined();

    // Must receive rescue offers from lower/mid teams (rating 65 - penalty ~ 15-20 => ~45-50)
    expect(summary!.availableOffers.length).toBeGreaterThan(0);
    expect(summary!.availableOffers.every((o) => o.isRescueOffer)).toBe(true);

    // The manager chooses to accept a rescue offer from Sauber or Haas or RB
    const rescueOffer = summary!.availableOffers[0];
    const accepted = await useGameStore.getState().acceptTeamPrincipalOffer(rescueOffer.teamId, mockAdapter);
    expect(accepted).toBe(true);

    const afterAccept = useGameStore.getState().gameState!;
    expect(afterAccept.playerTeamId).toBe(rescueOffer.teamId);
    expect(afterAfterAcceptTeamsManaged(afterAccept, rescueOffer.teamId)).toBe(true);
    expect(afterAccept.seasonTransitionSummary?.playerIsDismissed).toBe(false);

    // Can now successfully start the next season
    const started = await useGameStore.getState().startNextSeason(mockAdapter);
    expect(started).toBe(true);
    expect(useGameStore.getState().gameState?.season.seasonNumber).toBe(2);
    expect(useGameStore.getState().gameState?.season.currentRaceIndex).toBe(0);
  });
});

function afterAfterAcceptTeamsManaged(state: GameState, teamId: string): boolean {
  return state.managerProfile.teamsManaged?.includes(teamId) ?? false;
}
