import { describe, it, expect } from 'vitest';
import { generateSingleYouthDriver, generateYouthDriverPool } from '@/domain/academy/proceduralGeneration';

describe('Tarea 6.1: Generador Procedural Anual de Talentos Ficticios (AC-05.1)', () => {
  it('debe generar 50 pilotos juveniles sin IDs duplicados, con edades entre 16 y 19 y atributos válidos', () => {
    const generated = [];
    const ids = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const driver = generateSingleYouthDriver('test-youth');
      generated.push(driver);
      ids.add(driver.id);

      // Verify Age (AC-05.1 & RF-5.2: 16-19)
      expect(driver.age).toBeGreaterThanOrEqual(16);
      expect(driver.age).toBeLessThanOrEqual(19);

      // Verify Reduced base stats (Pace, Consistency)
      expect(driver.pace).toBeGreaterThanOrEqual(50);
      expect(driver.pace).toBeLessThanOrEqual(75);
      expect(driver.consistency).toBeGreaterThanOrEqual(50);
      expect(driver.consistency).toBeLessThanOrEqual(75);

      // Verify High Potential
      expect(driver.potential).toBeGreaterThanOrEqual(82);
      expect(driver.potential).toBeLessThanOrEqual(98);
      expect(driver.potential).toBeGreaterThan(driver.pace);

      // Verify Morale in valid range
      expect(driver.morale).toBeGreaterThanOrEqual(0);
      expect(driver.morale).toBeLessThanOrEqual(100);

      // Nationality and Name present
      expect(driver.name.trim().length).toBeGreaterThan(3);
      expect(driver.nationality.trim().length).toBeGreaterThan(2);

      // Initially free agent
      expect(driver.teamId).toBeNull();
    }

    // Exactly 50 unique IDs
    expect(ids.size).toBe(50);
  });

  it('debe generar una hornada anual de talentos con nombres únicos', () => {
    const pool = generateYouthDriverPool(10, 2);
    expect(pool).toHaveLength(10);

    const names = new Set(pool.map((p) => p.name));
    expect(names.size).toBe(10);
  });
});
