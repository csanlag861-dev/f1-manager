import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useGameStore } from '../../src/application/store/gameStore';
import { storageAdapter } from '../../src/infrastructure/storage/indexedDbAdapter';

describe('Integración: Exportación e Importación de Partida con GameStore (AC-09.4, AC-09.5, AC-09.6)', () => {
  beforeEach(async () => {
    await storageAdapter.clearGameState();
  });

  it('permite exportar la partida activa a JSON plano y reimportarla restaurando el estado en IndexedDB', async () => {
    // 1. Inicializar partida
    await useGameStore.getState().initGame('mclaren', 'Zak Brown');
    const originalState = useGameStore.getState().gameState;
    expect(originalState).not.toBeNull();
    expect(originalState?.playerTeamId).toBe('mclaren');

    // 2. Exportar a JSON
    const exportedJson = useGameStore.getState().exportGameToJson();
    expect(exportedJson).not.toBeNull();
    expect(typeof exportedJson).toBe('string');

    // 3. Modificar o resetear el estado local
    await useGameStore.getState().resetGame();
    expect(useGameStore.getState().gameState).toBeNull();

    // 4. Importar el JSON exportado
    const importResult = await useGameStore.getState().importGameFromJson(exportedJson!);
    expect(importResult.success).toBe(true);

    // 5. Verificar que el estado en memoria y en IndexedDB se recuperó idéntico
    const restoredState = useGameStore.getState().gameState;
    expect(restoredState).not.toBeNull();
    expect(restoredState?.playerTeamId).toBe('mclaren');
    expect(restoredState?.managerProfile.name).toBe('Zak Brown');

    // Verificar en almacenamiento real
    const dbState = await storageAdapter.loadGameState();
    expect(dbState?.playerTeamId).toBe('mclaren');
    expect(dbState?.managerProfile.name).toBe('Zak Brown');
  });

  it('si se intenta importar un archivo JSON corrupto, lo rechaza y preserva intacto el estado previo en IndexedDB', async () => {
    // 1. Inicializar partida legítima
    await useGameStore.getState().initGame('red-bull', 'Christian Horner');
    const previousState = useGameStore.getState().gameState;
    expect(previousState?.playerTeamId).toBe('red-bull');

    // 2. Intentar importar JSON corrupto
    const corruptJson = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        playerTeamId: 'fakeTeam',
        // faltan datos vitales
      },
    });

    const result = await useGameStore.getState().importGameFromJson(corruptJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Archivo de guardado no válido');

    // 3. Verificar que el estado en el store y en IndexedDB no fue corrompido
    const currentState = useGameStore.getState().gameState;
    expect(currentState?.playerTeamId).toBe('red-bull');
    expect(currentState?.managerProfile.name).toBe('Christian Horner');

    const dbState = await storageAdapter.loadGameState();
    expect(dbState?.playerTeamId).toBe('red-bull');
    expect(dbState?.managerProfile.name).toBe('Christian Horner');
  });
});
