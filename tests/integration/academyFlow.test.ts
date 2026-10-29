import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useGameStore } from '@/application/store/gameStore';
import { storageAdapter } from '@/infrastructure/storage/indexedDbAdapter';

describe('Integración: Hito 6 - Academia de Jóvenes Promesas, Límite, Entrenamiento y Promoción', () => {
  beforeEach(async () => {
    await storageAdapter.clearGameState();
    useGameStore.setState({ gameState: null, isLoading: false, isSaving: false, error: null });
  });

  it('debe gestionar el ciclo de incorporación y límite de 2 plazas en la academia (AC-05.2)', async () => {
    const store = useGameStore.getState();
    await store.initGame('williams', 'James Vowles');

    let state = useGameStore.getState().gameState!;
    const availableYouth = state.youthDrivers.filter((y) => y.teamId === null);
    expect(availableYouth.length).toBeGreaterThanOrEqual(3);

    const youth1 = availableYouth[0];
    const youth2 = availableYouth[1];
    const youth3 = availableYouth[2];

    // 1. Sign 1st youth driver
    const sign1Ok = await useGameStore.getState().signYouthDriver(youth1.id, storageAdapter);
    expect(sign1Ok).toBe(true);

    state = useGameStore.getState().gameState!;
    let playerTeam = state.teams.find((t) => t.id === 'williams')!;
    expect(playerTeam.youthDriverIds).toEqual([youth1.id]);

    // 2. Sign 2nd youth driver
    const sign2Ok = await useGameStore.getState().signYouthDriver(youth2.id, storageAdapter);
    expect(sign2Ok).toBe(true);

    state = useGameStore.getState().gameState!;
    playerTeam = state.teams.find((t) => t.id === 'williams')!;
    expect(playerTeam.youthDriverIds).toEqual([youth1.id, youth2.id]);
    expect(playerTeam.youthDriverIds).toHaveLength(2);

    // 3. Try to sign 3rd youth driver -> blocked by 2-slot limit (AC-05.2)
    const sign3Ok = await useGameStore.getState().signYouthDriver(youth3.id, storageAdapter);
    expect(sign3Ok).toBe(false);
    expect(useGameStore.getState().error).toContain('límite máximo de 2 plazas');

    state = useGameStore.getState().gameState!;
    playerTeam = state.teams.find((t) => t.id === 'williams')!;
    expect(playerTeam.youthDriverIds).toHaveLength(2);

    // 4. Release 1st youth driver -> slot freed
    const releaseOk = await useGameStore.getState().releaseYouthDriver(youth1.id, storageAdapter);
    expect(releaseOk).toBe(true);

    state = useGameStore.getState().gameState!;
    playerTeam = state.teams.find((t) => t.id === 'williams')!;
    expect(playerTeam.youthDriverIds).toEqual([youth2.id]);
    expect(playerTeam.youthDriverIds).toHaveLength(1);
  });

  it('debe ejecutar el entrenamiento anual potenciado por el simulador al concluir la temporada (AC-05.3, AC-05.1)', async () => {
    const store = useGameStore.getState();
    await store.initGame('ferrari', 'Fred Vasseur'); // Ferrari has simulator level 5

    let state = useGameStore.getState().gameState!;
    const candidate = state.youthDrivers.find((y) => y.teamId === null)!;
    const initialPace = candidate.pace;
    const initialConsistency = candidate.consistency;

    // Sign candidate to Ferrari academy
    await useGameStore.getState().signYouthDriver(candidate.id, storageAdapter);

    state = useGameStore.getState().gameState!;
    const signedCandidate = state.youthDrivers.find((y) => y.id === candidate.id)!;
    expect(signedCandidate.teamId).toBe('ferrari');

    // Advance to end of season (race 24: index 23 -> 24)
    useGameStore.setState({
      gameState: {
        ...state,
        season: {
          ...state.season,
          currentRaceIndex: 23,
        },
      },
    });

    const youthCountBefore = state.youthDrivers.length;

    // End of season transition
    await useGameStore.getState().advanceToNextRound(storageAdapter);

    const endOfSeasonState = useGameStore.getState().gameState!;
    const trainedYouth = endOfSeasonState.youthDrivers.find((y) => y.id === candidate.id)!;

    // Attributes increased significantly under simulator level 5 (AC-05.3)
    expect(trainedYouth.pace).toBeGreaterThan(initialPace);
    expect(trainedYouth.consistency).toBeGreaterThan(initialConsistency);
    expect(trainedYouth.age).toBe(candidate.age + 1);

    // New intake of prospective talent generated (AC-05.1)
    expect(endOfSeasonState.youthDrivers.length).toBeGreaterThan(youthCountBefore);
  });

  it('debe ascender a una joven promesa al asiento titular vacante y liberar su plaza en la academia (AC-05.4)', async () => {
    const store = useGameStore.getState();
    await store.initGame('alpine', 'Flavio Briatore');

    let state = useGameStore.getState().gameState!;
    const candidate = state.youthDrivers.find((y) => y.teamId === null)!;

    // Sign candidate into Alpine academy
    await useGameStore.getState().signYouthDriver(candidate.id, storageAdapter);

    // Simulate vacancy in Seat 2 of Alpine
    state = useGameStore.getState().gameState!;
    const updatedTeams = state.teams.map((t) =>
      t.id === 'alpine' ? { ...t, driverIds: [t.driverIds[0], ''] as [string, string] } : t
    );
    useGameStore.setState({ gameState: { ...state, teams: updatedTeams } });

    // Promote candidate to vacant Seat 2 (AC-05.4)
    const promoteOk = await useGameStore.getState().promoteYouthDriver(candidate.id, 2, 2_000_000, 2, storageAdapter);
    expect(promoteOk).toBe(true);

    const promotedState = useGameStore.getState().gameState!;
    const alpine = promotedState.teams.find((t) => t.id === 'alpine')!;

    // Driver is now race driver 2
    expect(alpine.driverIds[1]).toBe(candidate.id);
    // Academy slot is freed
    expect(alpine.youthDriverIds).not.toContain(candidate.id);

    // Promoted driver is in official Drivers roster with novice contract and salary
    const newRaceDriver = promotedState.drivers.find((d) => d.id === candidate.id)!;
    expect(newRaceDriver).toBeDefined();
    expect(newRaceDriver.name).toBe(candidate.name);
    expect(newRaceDriver.salary).toBe(2_000_000);
    expect(newRaceDriver.contractYears).toBe(2);
    expect(newRaceDriver.teamId).toBe('alpine');

    // Removed from active youth drivers list
    expect(promotedState.youthDrivers.find((y) => y.id === candidate.id)).toBeUndefined();
  });
});
