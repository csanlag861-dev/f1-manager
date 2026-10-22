import { create } from 'zustand';
import { GameState, RaceWeekendResult } from '../../domain/models';
import { createInitialGameState } from '../../config/initialTeamsData';
import { storageAdapter, StorageAdapter } from '../../infrastructure/storage/indexedDbAdapter';
import { updateSeasonStandings } from '../../domain/season';
import { calculateRaceFinancialSettlement } from '../../domain/economy';

export interface GameStoreState {
  gameState: GameState | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  initGame: (playerTeamId: string, managerName?: string, customAdapter?: StorageAdapter) => Promise<GameState>;
  loadGame: (customAdapter?: StorageAdapter) => Promise<GameState | null>;
  saveCurrentGame: (customAdapter?: StorageAdapter) => Promise<void>;
  applyRaceResults: (result: RaceWeekendResult, customAdapter?: StorageAdapter) => Promise<void>;
  advanceToNextRound: (customAdapter?: StorageAdapter) => Promise<void>;
  resetGame: (customAdapter?: StorageAdapter) => Promise<void>;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  isLoading: false,
  isSaving: false,
  error: null,

  initGame: async (playerTeamId: string, managerName = 'Team Principal', customAdapter?: StorageAdapter) => {
    const adapter = customAdapter || storageAdapter;
    set({ isLoading: true, error: null });
    try {
      const newState = createInitialGameState(playerTeamId, managerName);
      await adapter.saveGameState(newState);
      set({ gameState: newState, isLoading: false });
      return newState;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al inicializar la partida';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  loadGame: async (customAdapter?: StorageAdapter) => {
    const adapter = customAdapter || storageAdapter;
    set({ isLoading: true, error: null });
    try {
      const loaded = await adapter.loadGameState();
      set({ gameState: loaded, isLoading: false });
      return loaded;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar la partida';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  saveCurrentGame: async (customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return;

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true });
    try {
      await adapter.saveGameState(gameState);
      set({ isSaving: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      set({ error: message, isSaving: false });
    }
  },

  applyRaceResults: async (result: RaceWeekendResult, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return;

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true });

    try {
      const updatedSeason = updateSeasonStandings(gameState.season, result.raceResults);

      // Financial Settlement
      const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
      const playerCar = gameState.cars.find((c) => c.id === playerTeam?.carId);
      const playerEngineer = gameState.chiefEngineers.find((e) => e.id === playerTeam?.chiefEngineerId);

      let isBankrupt = false;
      let bankruptcyDetails: { debt: number; maxAllowedDebt: number } | undefined = undefined;
      let updatedTeams = gameState.teams;

      if (playerTeam && playerCar) {
        const settlement = calculateRaceFinancialSettlement(
          playerTeam,
          playerCar,
          gameState.drivers,
          playerEngineer,
          result.raceResults
        );

        result.playerFinancials = {
          baseSponsorIncome: settlement.sponsor.baseIncome,
          bonusSponsorIncome: settlement.sponsor.bonusIncome,
          bonusAchieved: settlement.sponsor.bonusAchieved,
          salariesCost: settlement.expenses.salariesCost,
          maintenanceCost: settlement.expenses.maintenanceCost,
          dnfRepairCost: settlement.dnfRepairCost,
          netIncome: settlement.netIncome,
        };

        updatedTeams = gameState.teams.map((t) =>
          t.id === playerTeam.id ? { ...t, budget: settlement.newBudget } : t
        );

        if (settlement.isBankrupt) {
          isBankrupt = true;
          bankruptcyDetails = {
            debt: settlement.currentDebt,
            maxAllowedDebt: settlement.maxAllowedDebt,
          };
        }
      }

      const nextState: GameState = {
        ...gameState,
        season: updatedSeason,
        teams: updatedTeams,
        lastRaceResult: result,
        isBankrupt: Boolean(isBankrupt || gameState.isBankrupt),
        bankruptcyDetails: bankruptcyDetails || gameState.bankruptcyDetails,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar resultados de carrera';
      set({ error: message, isSaving: false });
      throw err;
    }
  },

  advanceToNextRound: async (customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return;

    if (gameState.isBankrupt) {
      const errorMsg = 'Partida bloqueada: La escudería se encuentra en bancarrota (Game Over).';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true });

    try {
      const nextIndex = gameState.season.currentRaceIndex + 1;
      const nextState: GameState = {
        ...gameState,
        season: {
          ...gameState.season,
          currentRaceIndex: nextIndex,
        },
        lastRaceResult: null,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al avanzar de ronda';
      set({ error: message, isSaving: false });
      throw err;
    }
  },

  resetGame: async (customAdapter?: StorageAdapter) => {
    const adapter = customAdapter || storageAdapter;
    set({ isLoading: true });
    try {
      await adapter.clearGameState();
      set({ gameState: null, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al resetear la partida';
      set({ error: message, isLoading: false });
    }
  },
}));
