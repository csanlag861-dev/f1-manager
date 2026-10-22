import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useGameStore } from '@/application/store/gameStore';
import { storageAdapter } from '@/infrastructure/storage/indexedDbAdapter';
import { INITIAL_TEAMS } from '@/config/initialTeamsData';

describe('Tarea 1.5: Flujo de Selección de Escudería (AC-01.1, AC-01.2, AC-01.3)', () => {
  beforeEach(async () => {
    await storageAdapter.clearGameState();
    useGameStore.setState({ gameState: null });
  });

  it('permite a un usuario seleccionar una escudería, asignar nombre de Team Principal y arrancar en la Ronda 1', async () => {
    const selectedTeam = INITIAL_TEAMS.find((t) => t.id === 'mercedes')!;
    expect(selectedTeam).toBeDefined();

    const state = await useGameStore.getState().initGame('mercedes', 'Toto Wolff');

    expect(state.playerTeamId).toBe('mercedes');
    expect(state.managerProfile.name).toBe('Toto Wolff');
    expect(state.managerProfile.tpRating).toBe(selectedTeam.reputation);
    expect(state.season.seasonNumber).toBe(1);
    expect(state.season.currentRaceIndex).toBe(0);

    // Verify it was persisted in IndexedDB
    const saved = await storageAdapter.loadGameState();
    expect(saved).not.toBeNull();
    expect(saved?.playerTeamId).toBe('mercedes');
    expect(saved?.managerProfile.name).toBe('Toto Wolff');
  });

  it('asigna el objetivo de temporada de la directiva y rating correspondiente', async () => {
    const state = await useGameStore.getState().initGame('williams', 'James Vowles');
    const team = state.teams.find((t) => t.id === 'williams');

    expect(team?.boardExpectations.targetConstructorsPosition).toBe(7);
    expect(state.managerProfile.tpRating).toBe(75);
  });
});
