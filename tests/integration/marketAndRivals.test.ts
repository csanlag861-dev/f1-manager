import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useGameStore } from '@/application/store/gameStore';
import { storageAdapter } from '@/infrastructure/storage/indexedDbAdapter';
import { RaceWeekendResult } from '@/domain/models';

describe('Integración: Hito 5 - Mercado de Personal, Contratos e IA Rival', () => {
  beforeEach(async () => {
    await storageAdapter.clearGameState();
    useGameStore.setState({ gameState: null, isLoading: false, isSaving: false, error: null });
  });

  it('debe impedir a una escudería modesta fichar a un piloto de élite por reputación insuficiente (AC-04.2)', async () => {
    const store = useGameStore.getState();
    await store.initGame('haas', 'Ayao Komatsu'); // Haas reputation: 68

    // Verstappen demands ~94-96 reputation
    const hireSuccess = await useGameStore.getState().hireDriver('verstappen', 1, 2, storageAdapter);
    expect(hireSuccess).toBe(false);
    expect(useGameStore.getState().error).toContain('reputación');

    // Haas drivers remain unchanged
    const state = useGameStore.getState().gameState!;
    const haas = state.teams.find((t) => t.id === 'haas')!;
    expect(haas.driverIds[0]).toBe('ocon');
  });

  it('debe permitir a un equipo top fichar a un piloto rescindiendo al titular con indemnización (AC-04.2)', async () => {
    const store = useGameStore.getState();
    await store.initGame('red-bull', 'Christian Horner'); // Red Bull reputation: 95

    const initialState = useGameStore.getState().gameState!;
    const initialRedBull = initialState.teams.find((t) => t.id === 'red-bull')!;
    const initialBudget = initialRedBull.budget;
    const initialLawson = initialState.drivers.find((d) => d.id === 'lawson')!;
    const candidateSainz = initialState.drivers.find((d) => d.id === 'sainz')!; // Sainz req rep 90, Red Bull has 95

    // Expected severance: 50% * lawson.salary * lawson.contractYears
    const expectedSeverance = Math.round(initialLawson.salary * 0.5 * initialLawson.contractYears);
    const expectedCost = candidateSainz.salary + expectedSeverance;

    // Hire Sainz into seat 2 (replacing Lawson)
    const hireOk = await useGameStore.getState().hireDriver('sainz', 2, 2, storageAdapter);
    expect(hireOk).toBe(true);

    const updatedState = useGameStore.getState().gameState!;
    const updatedRedBull = updatedState.teams.find((t) => t.id === 'red-bull')!;
    const updatedLawson = updatedState.drivers.find((d) => d.id === 'lawson')!;
    const updatedSainz = updatedState.drivers.find((d) => d.id === 'sainz')!;

    // Sainz is now in seat 2 of Red Bull with 2 years contract
    expect(updatedRedBull.driverIds[1]).toBe('sainz');
    expect(updatedSainz.teamId).toBe('red-bull');
    expect(updatedSainz.contractYears).toBe(2);

    // Lawson is now a free agent
    expect(updatedLawson.teamId).toBeNull();
    expect(updatedLawson.contractYears).toBe(0);

    // Budget correctly decremented by candidate salary + severance
    expect(updatedRedBull.budget).toBe(initialBudget - expectedCost);
  });

  it('debe permitir contratar un jefe de ingenieros sustituyendo al titular (AC-04.2)', async () => {
    const store = useGameStore.getState();
    await store.initGame('ferrari', 'Fred Vasseur'); // Ferrari rep: 96

    const initialState = useGameStore.getState().gameState!;
    const initialFerrari = initialState.teams.find((t) => t.id === 'ferrari')!;
    const initialBudget = initialFerrari.budget;
    const oldEngineerId = initialFerrari.chiefEngineerId; // eng-ferrari

    // Hire James Allison (eng-mercedes) from Mercedes
    const allison = initialState.chiefEngineers.find((e) => e.id === 'eng-mercedes')!;
    const hireOk = await useGameStore.getState().hireChiefEngineer(allison.id, 2, storageAdapter);
    expect(hireOk).toBe(true);

    const updatedState = useGameStore.getState().gameState!;
    const updatedFerrari = updatedState.teams.find((t) => t.id === 'ferrari')!;
    const updatedAllison = updatedState.chiefEngineers.find((e) => e.id === 'eng-mercedes')!;
    const updatedOldEngineer = updatedState.chiefEngineers.find((e) => e.id === oldEngineerId)!;

    expect(updatedFerrari.chiefEngineerId).toBe('eng-mercedes');
    expect(updatedAllison.teamId).toBe('ferrari');
    expect(updatedOldEngineer.teamId).toBeNull();
    expect(updatedOldEngineer.contractYears).toBe(0);
    expect(updatedFerrari.budget).toBeLessThan(initialBudget);
  });

  it('debe gestionar renovaciones de contrato solo cuando resta <= 1 año (AC-04.3)', async () => {
    const store = useGameStore.getState();
    await store.initGame('mclaren', 'Andrea Stella');

    let state = useGameStore.getState().gameState!;
    // Norris has contractYears = 3 initially
    const norris = state.drivers.find((d) => d.id === 'norris')!;
    expect(norris.contractYears).toBe(3);

    // Attempting to renew Norris should fail (contract > 1 year)
    const renewNorrisFail = await useGameStore.getState().renewContract('norris', true, 2, storageAdapter);
    expect(renewNorrisFail).toBe(false);
    expect(useGameStore.getState().error).toContain('1 año o menos');

    // Piastri has contractYears = 3 -> simulate him reaching 1 year remaining
    const updatedDrivers = state.drivers.map((d) => (d.id === 'piastri' ? { ...d, contractYears: 1 } : d));
    useGameStore.setState({ gameState: { ...state, drivers: updatedDrivers } });

    // Renew Piastri -> should succeed
    const initialSalary = state.drivers.find((d) => d.id === 'piastri')!.salary;
    const renewPiastriOk = await useGameStore.getState().renewContract('piastri', true, 2, storageAdapter);
    expect(renewPiastriOk).toBe(true);

    const stateAfter = useGameStore.getState().gameState!;
    const renewedPiastri = stateAfter.drivers.find((d) => d.id === 'piastri')!;
    expect(renewedPiastri.contractYears).toBe(3); // 1 + 2
    expect(renewedPiastri.salary).toBe(Math.round(initialSalary * 1.05));
  });

  it('debe ejecutar decisiones autónomas de IA rival y procesar expiraciones al fin de temporada (AC-07.1, AC-07.2, AC-04.4)', async () => {
    const store = useGameStore.getState();
    await store.initGame('red-bull', 'Christian Horner');

    let state = useGameStore.getState().gameState!;

    // Initial check: rival cars (e.g. ferrari) have 0 upgrades in progress
    const ferrariCarBefore = state.cars.find((c) => c.teamId === 'ferrari')!;
    expect(ferrariCarBefore.upgradesInProgress).toHaveLength(0);

    // Mock a race result to run applyRaceResults
    const mockRaceResult: RaceWeekendResult = {
      roundIndex: 0,
      circuitId: 'bahrain',
      raceResults: state.drivers.map((d, index) => ({
        driverId: d.id,
        teamId: d.teamId || 'red-bull',
        gridPosition: index + 1,
        finishPosition: index + 1,
        points: index === 0 ? 25 : 0,
        status: 'finished' as const,
        dnfReason: undefined,
      })),
      poleDriverId: 'verstappen',
      fastestLapDriverId: 'verstappen',
    };

    await useGameStore.getState().applyRaceResults(mockRaceResult, storageAdapter);

    state = useGameStore.getState().gameState!;
    // Rival teams (e.g. ferrari, mclaren) with budget >= 15M should have ordered an upgrade autonomously (AC-07.1)
    const rivalCars = state.cars.filter((c) => c.teamId !== 'red-bull');
    const rivalCarsWithUpgrades = rivalCars.filter((c) => c.upgradesInProgress.length > 0);
    expect(rivalCarsWithUpgrades.length).toBeGreaterThan(0);

    // Test Season End: Advance to race 24 to trigger processContractExpirations (AC-04.4)
    // Set current race index to 23 (race 24 is index 23)
    useGameStore.setState({
      gameState: {
        ...state,
        season: {
          ...state.season,
          currentRaceIndex: 23,
        },
      },
    });

    // Mark one driver with 1 year remaining so they expire into free agency
    const testDriverId = state.drivers[0].id;
    const modifiedDrivers = state.drivers.map((d) =>
      d.id === testDriverId ? { ...d, contractYears: 1 } : d
    );
    useGameStore.setState({
      gameState: {
        ...useGameStore.getState().gameState!,
        drivers: modifiedDrivers,
      },
    });

    // Advance to next round -> index becomes 24 (end of season reached)
    await useGameStore.getState().advanceToNextRound(storageAdapter);

    const endOfSeasonState = useGameStore.getState().gameState!;
    const expiredDriver = endOfSeasonState.drivers.find((d) => d.id === testDriverId)!;
    expect(expiredDriver.contractYears).toBe(0);
    expect(expiredDriver.teamId).toBeNull(); // Has become a free agent (AC-04.4)
  });
});
