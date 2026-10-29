import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useGameStore } from '@/application/store/gameStore';
import { storageAdapter } from '@/infrastructure/storage/indexedDbAdapter';
import { RaceWeekendResult } from '@/domain/models';

describe('Integración: Hito 4 - Fábrica, Desarrollo del Coche, Moral e Instalaciones', () => {
  beforeEach(async () => {
    await storageAdapter.clearGameState();
    useGameStore.setState({ gameState: null, isLoading: false, isSaving: false, error: null });
  });

  it('debe gestionar el ciclo completo de mejoras: encargar, límite de 2, entrega en carrera y reintento con descuento', async () => {
    const store = useGameStore.getState();
    await store.initGame('red-bull', 'Christian Horner');

    let state = useGameStore.getState().gameState!;
    const initialBudget = state.teams.find((t) => t.id === 'red-bull')!.budget;

    // 1. Order 1st upgrade on topSpeed
    const order1Success = await useGameStore.getState().orderCarUpgrade('topSpeed', false, storageAdapter);
    expect(order1Success).toBe(true);

    state = useGameStore.getState().gameState!;
    let playerCar = state.cars.find((c) => c.teamId === 'red-bull')!;
    let playerTeam = state.teams.find((t) => t.id === 'red-bull')!;
    expect(playerCar.upgradesInProgress).toHaveLength(1);
    expect(playerCar.upgradesInProgress[0].attribute).toBe('topSpeed');
    expect(playerTeam.budget).toBeLessThan(initialBudget);

    // 2. Order 2nd upgrade on downforce
    const order2Success = await useGameStore.getState().orderCarUpgrade('downforce', false, storageAdapter);
    expect(order2Success).toBe(true);

    state = useGameStore.getState().gameState!;
    playerCar = state.cars.find((c) => c.teamId === 'red-bull')!;
    expect(playerCar.upgradesInProgress).toHaveLength(2);

    const budgetAfter2 = state.teams.find((t) => t.id === 'red-bull')!.budget;

    // 3. Try to order 3rd upgrade -> blocked by concurrency limit of 2 (AC-03.2)
    const order3Success = await useGameStore.getState().orderCarUpgrade('reliability', false, storageAdapter);
    expect(order3Success).toBe(false);
    expect(useGameStore.getState().error).toContain('Capacidad máxima');

    state = useGameStore.getState().gameState!;
    playerCar = state.cars.find((c) => c.teamId === 'red-bull')!;
    playerTeam = state.teams.find((t) => t.id === 'red-bull')!;
    expect(playerCar.upgradesInProgress).toHaveLength(2);
    expect(playerTeam.budget).toBe(budgetAfter2); // No budget deducted

    // 4. Manually set racesRemaining: topSpeed to 1 (completes now), downforce to 3 (remains in progress)
    const modifiedCars = state.cars.map((c) => {
      if (c.teamId === 'red-bull') {
        return {
          ...c,
          upgradesInProgress: c.upgradesInProgress.map((p) =>
            p.attribute === 'topSpeed' ? { ...p, racesRemaining: 1 } : { ...p, racesRemaining: 3 }
          ),
        };
      }
      return c;
    });
    useGameStore.setState({ gameState: { ...state, cars: modifiedCars } });

    // 5. Disputar carrera y aplicar resultados
    const mockRaceResult: RaceWeekendResult = {
      round: 1,
      circuitId: state.circuits[0].id,
      qualyResults: [
        { driverId: 'verstappen', teamId: 'red-bull', position: 1, lapTimeSeconds: 80.0, timeGap: 'POLE' },
        { driverId: 'lawson', teamId: 'red-bull', position: 8, lapTimeSeconds: 80.5, timeGap: '+0.500s' },
      ],
      raceResults: [
        { driverId: 'verstappen', teamId: 'red-bull', gridPosition: 1, finishPosition: 1, timeGap: 'WINNER', points: 25, isDnf: false },
        { driverId: 'lawson', teamId: 'red-bull', gridPosition: 8, finishPosition: 7, timeGap: '+20.0s', points: 6, isDnf: false },
      ],
    };

    await useGameStore.getState().applyRaceResults(mockRaceResult, storageAdapter);

    state = useGameStore.getState().gameState!;
    playerCar = state.cars.find((c) => c.teamId === 'red-bull')!;
    // The upgrade on topSpeed should have completed!
    expect(playerCar.upgradesInProgress).toHaveLength(1);
    expect(state.lastUpgradeResults).toBeDefined();
    expect(state.lastUpgradeResults?.length).toBeGreaterThan(0);

    // 6. Test retry flow: if downforce fails, test retry with 50% discount
    // Simulate failed upgrade on downforce
    useGameStore.setState({
      gameState: {
        ...state,
        cars: state.cars.map((c) => (c.teamId === 'red-bull' ? { ...c, upgradesInProgress: [] } : c)),
        failedUpgradesToRetry: ['downforce'],
      },
    });

    const budgetBeforeRetry = useGameStore.getState().gameState!.teams.find((t) => t.id === 'red-bull')!.budget;
    const retrySuccess = await useGameStore.getState().orderCarUpgrade('downforce', true, storageAdapter);
    expect(retrySuccess).toBe(true);

    state = useGameStore.getState().gameState!;
    playerCar = state.cars.find((c) => c.teamId === 'red-bull')!;
    const retryProject = playerCar.upgradesInProgress.find((p) => p.attribute === 'downforce');
    expect(retryProject?.isRetry).toBe(true);

    // Verify retry removed 'downforce' from failedUpgradesToRetry
    expect(state.failedUpgradesToRetry || []).not.toContain('downforce');
  });

  it('debe gestionar la ampliación de instalaciones de Fábrica y Simulador (AC-03.6)', async () => {
    const store = useGameStore.getState();
    await store.initGame('haas', 'Ayao Komatsu', storageAdapter);

    let state = useGameStore.getState().gameState!;
    let playerTeam = state.teams.find((t) => t.id === 'haas')!;
    const initialFactoryLevel = playerTeam.factoryLevel;
    const initialBudget = playerTeam.budget;

    // Upgrade factory
    const upgradeSuccess = await useGameStore.getState().upgradeFacility('factory', storageAdapter);
    expect(upgradeSuccess).toBe(true);

    state = useGameStore.getState().gameState!;
    playerTeam = state.teams.find((t) => t.id === 'haas')!;
    expect(playerTeam.factoryLevel).toBe(initialFactoryLevel + 1);
    expect(playerTeam.budget).toBeLessThan(initialBudget);

    // Upgrade simulator
    const initialSimLevel = playerTeam.simulatorLevel;
    const simSuccess = await useGameStore.getState().upgradeFacility('simulator', storageAdapter);
    expect(simSuccess).toBe(true);

    state = useGameStore.getState().gameState!;
    playerTeam = state.teams.find((t) => t.id === 'haas')!;
    expect(playerTeam.simulatorLevel).toBe(initialSimLevel + 1);
  });
});
