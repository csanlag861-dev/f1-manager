import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../../src/config/initialTeamsData';
import { serializeGameState, validateAndParseSaveGame } from '../../src/domain/serialization/saveGameSchema';

describe('Módulo 9: Validación y Portabilidad JSON (AC-09.4, AC-09.5, AC-09.6)', () => {
  const sampleState = createInitialGameState('ferrari', 'Director de Prueba');

  it('AC-09.4: exporta el estado íntegro a JSON plano legible con metadatos de versión y timestamp', () => {
    const serialized = serializeGameState(sampleState);
    expect(typeof serialized).toBe('string');

    const parsed = JSON.parse(serialized);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.data.managerProfile.name).toBe('Director de Prueba');
    expect(parsed.data.playerTeamId).toBe('ferrari');
    expect(parsed.data.teams).toHaveLength(10);
    expect(parsed.data.drivers).toHaveLength(20);
    expect(parsed.data.circuits).toHaveLength(24);
  });

  it('AC-09.5: valida y restaura un archivo JSON de guardado legítimo sin pérdida de datos', () => {
    const serialized = serializeGameState(sampleState);
    const result = validateAndParseSaveGame(serialized);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.playerTeamId).toBe('ferrari');
    expect(result.data?.managerProfile.tpRating).toBe(sampleState.managerProfile.tpRating);
    expect(result.data?.season.seasonNumber).toBe(1);
    expect(result.data?.circuits).toHaveLength(24);
  });

  it('AC-09.6: rechaza cadenas que no sean JSON válido con mensaje descriptivo', () => {
    const corruptedString = '{ this is not a valid JSON string : ';
    const result = validateAndParseSaveGame(corruptedString);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Archivo de guardado no válido');
    expect(result.error).toContain('formato JSON');
  });

  it('AC-09.6: rechaza un JSON con estructura ausente (sin version o data)', () => {
    const invalidJson = JSON.stringify({
      version: '1.0.0',
      // falta campo data
    });

    const result = validateAndParseSaveGame(invalidJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Archivo de guardado no válido');
    expect(result.error).toContain('data');
  });

  it('AC-09.6: rechaza un JSON con valores numéricos fuera de rango reglamentario', () => {
    const corruptedState = JSON.parse(JSON.stringify(sampleState));
    // Forzar tpRating fuera de rango [0, 100]
    corruptedState.managerProfile.tpRating = 999;

    const serialized = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: corruptedState,
    });

    const result = validateAndParseSaveGame(serialized);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Archivo de guardado no válido');
    expect(result.error).toContain('tpRating');
  });

  it('AC-09.6: rechaza un JSON con atributos de monoplaza corruptos', () => {
    const corruptedState = JSON.parse(JSON.stringify(sampleState));
    // Forzar topSpeed fuera de rango [1, 100]
    corruptedState.cars[0].topSpeed = -10;

    const serialized = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: corruptedState,
    });

    const result = validateAndParseSaveGame(serialized);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Archivo de guardado no válido');
  });
});
