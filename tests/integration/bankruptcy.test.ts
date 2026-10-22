import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useGameStore } from '@/application/store/gameStore';
import { storageAdapter } from '@/infrastructure/storage/indexedDbAdapter';
import { defaultSimulationConfig } from '@/config/simulationConfig';

describe('Tarea 3.4: Regla y Pantalla de Bancarrota (AC-02.4)', () => {
  beforeEach(async () => {
    await storageAdapter.clearGameState();
    useGameStore.setState({ gameState: null });
  });

  it('detecta quiebra cuando la deuda supera el límite permitido y bloquea el avance del juego', async () => {
    const store = useGameStore.getState();
    await store.initGame('haas', 'Ayao Komatsu');

    const initialState = useGameStore.getState().gameState!;
    const playerTeam = initialState.teams.find((t) => t.id === 'haas')!;
    
    // Haas base budget is 50_000_000. With maxDebtPercentage 0.25, max allowed debt is 12_500_000.
    const maxAllowedDebt = Math.round(playerTeam.baseBudget * defaultSimulationConfig.maxDebtPercentage);
    expect(maxAllowedDebt).toBe(12500000);

    // Force team budget to a critical negative level exceeding allowed debt
    const bankruptBudget = -(maxAllowedDebt + 100000); // 7.1M debt
    useGameStore.setState({
      gameState: {
        ...initialState,
        teams: initialState.teams.map((t) =>
          t.id === 'haas' ? { ...t, budget: bankruptBudget } : t
        ),
      },
    });

    const circuit1 = initialState.circuits[0];
    const dummyRaceResults = initialState.drivers.map((d, index) => ({
      driverId: d.id,
      driverName: d.name,
      teamId: d.teamId || '',
      teamName: initialState.teams.find((t) => t.id === d.teamId)!.name,
      gridPosition: index + 1,
      finishPosition: index + 1,
      isDnf: false,
      dnfReason: undefined,
      points: index === 0 ? 25 : 0,
      totalRaceTime: 5400 + index * 2,
      timeGap: `+${index * 2}.000s`,
      fastestLapTime: 90 + index * 0.1,
    }));

    // Apply race results where financial settlement keeps debt above the limit
    await store.applyRaceResults({
      round: circuit1.round,
      circuitId: circuit1.id,
      qualyResults: [],
      raceResults: dummyRaceResults,
    });

    const afterRaceState = useGameStore.getState().gameState!;
    expect(afterRaceState.isBankrupt).toBe(true);
    expect(afterRaceState.bankruptcyDetails).toBeDefined();
    expect(afterRaceState.bankruptcyDetails?.debt).toBeGreaterThan(maxAllowedDebt);
    expect(afterRaceState.bankruptcyDetails?.maxAllowedDebt).toBe(maxAllowedDebt);

    // Advancing to next round must be strictly blocked and throw an error
    await expect(store.advanceToNextRound()).rejects.toThrow(
      /bancarrota/i
    );

    // Current race index should remain 0, unchanged
    expect(useGameStore.getState().gameState?.season.currentRaceIndex).toBe(0);
  });

  it('permite avanzar si la deuda está dentro del margen de crédito permitido', async () => {
    const store = useGameStore.getState();
    await store.initGame('haas', 'Ayao Komatsu');

    const initialState = useGameStore.getState().gameState!;
    const playerTeam = initialState.teams.find((t) => t.id === 'haas')!;
    const maxAllowedDebt = Math.round(playerTeam.baseBudget * defaultSimulationConfig.maxDebtPercentage);

    // Budget is negative but within credit limit (e.g. 1M debt vs 7M allowed)
    const tolerableBudget = -1000000;
    useGameStore.setState({
      gameState: {
        ...initialState,
        teams: initialState.teams.map((t) =>
          t.id === 'haas' ? { ...t, budget: tolerableBudget } : t
        ),
      },
    });

    const circuit1 = initialState.circuits[0];
    const dummyRaceResults = initialState.drivers.map((d, index) => ({
      driverId: d.id,
      driverName: d.name,
      teamId: d.teamId || '',
      teamName: initialState.teams.find((t) => t.id === d.teamId)!.name,
      gridPosition: index + 1,
      finishPosition: index + 1,
      isDnf: false,
      dnfReason: undefined,
      points: 0,
      totalRaceTime: 5400 + index * 2,
      timeGap: `+${index * 2}.000s`,
      fastestLapTime: 90 + index * 0.1,
    }));

    await store.applyRaceResults({
      round: circuit1.round,
      circuitId: circuit1.id,
      qualyResults: [],
      raceResults: dummyRaceResults,
    });

    const afterRaceState = useGameStore.getState().gameState!;
    // Haas sponsor base is 1.1M, expenses are ~450k-500k, so budget might even improve slightly,
    // but in any case isBankrupt must be false
    expect(afterRaceState.isBankrupt).toBe(false);

    // Advancing to next round succeeds
    await store.advanceToNextRound();
    expect(useGameStore.getState().gameState?.season.currentRaceIndex).toBe(1);
  });
});
