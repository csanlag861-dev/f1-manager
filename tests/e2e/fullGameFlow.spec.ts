import { test, expect } from '@playwright/test';

test.describe('E2E: Flujo Completo, Persistencia y Portabilidad JSON (Hito 8)', () => {
  test('Flujo E2E: Nueva partida -> Disputar GP -> Guardado -> Recarga -> Exportación -> Importación', async ({ page }) => {
    // 1. Ir a la página de nueva partida
    await page.goto('/new-game/');
    await expect(page.locator('#manager-name-input')).toBeVisible();

    // 2. Rellenar nombre del manager y confirmar escudería
    await page.locator('#manager-name-input').fill('E2E Test Director');
    await page.locator('#confirm-team-btn').click();

    // 3. Esperar redirección al Dashboard
    await page.waitForURL('**/dashboard/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('E2E Test Director')).toBeVisible();

    // 4. Navegar a Fin de Semana GP
    await page.locator('a[href="/race/"], a[href="/race"]').first().click();
    await page.waitForURL('**/race/');

    // 5. Disputar Clasificación (Qualy)
    const disputarBtn = page.locator('#disputar-gp-btn, #start-qualy-btn').first();
    await expect(disputarBtn).toBeVisible();
    await disputarBtn.click();

    // 6. Disputar Carrera
    const startRaceBtn = page.locator('#start-race-btn');
    await expect(startRaceBtn).toBeVisible();
    await startRaceBtn.click();

    // 7. Continuar al siguiente GP (guarda automáticamente en IndexedDB y avanza ronda)
    const continueBtn = page.locator('#continue-next-round-btn');
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // 8. Verificar que volvemos al Dashboard en la Ronda 2
    await page.waitForURL('**/dashboard/');
    await expect(page.getByText('Ronda 2 de 24')).toBeVisible();

    // 9. Comprobar persistencia recargando la página (AC-09.2)
    await page.reload();
    await expect(page.getByText('Ronda 2 de 24')).toBeVisible();
    await expect(page.getByText('E2E Test Director')).toBeVisible();

    // 10. Navegar a la pantalla de Ajustes
    await page.goto('/settings/');
    await expect(page.locator('#export-save-btn')).toBeVisible();

    // 11. Probar descarga de Exportación JSON (AC-09.4)
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-save-btn').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^f1manager_save_.*\.json$/);
    const saveFilePath = await download.path();
    expect(saveFilePath).toBeTruthy();

    // 12. Probar Importación de JSON (AC-09.5)
    // Usamos el archivo recién exportado para validar la importación
    await page.locator('#import-save-input').setInputFiles(saveFilePath!);
    await expect(page.locator('#import-save-success')).toBeVisible();
    await expect(page.getByText('Partida importada con éxito')).toBeVisible();
  });

  test('Validación E2E: Rechazo de archivo JSON corrupto sin alterar la partida previa (AC-09.6)', async ({ page }) => {
    // 1. Cargar una partida o ir a settings
    await page.goto('/new-game/');
    await page.locator('#manager-name-input').fill('Director Intacto');
    await page.locator('#confirm-team-btn').click();
    await page.waitForURL('**/dashboard/');

    // 2. Ir a Ajustes
    await page.goto('/settings/');
    await expect(page.locator('#import-save-btn')).toBeVisible();

    // 3. Crear buffer con JSON corrupto
    const corruptJsonBuffer = Buffer.from(
      JSON.stringify({
        version: '1.0.0',
        data: {
          managerProfile: { name: 'Hack', tpRating: 9999 }, // Fuera de rango
        },
      })
    );

    // 4. Intentar importar el archivo corrupto
    await page.locator('#import-save-input').setInputFiles({
      name: 'corrupt_save.json',
      mimeType: 'application/json',
      buffer: corruptJsonBuffer,
    });

    // 5. Verificar mensaje de error en pantalla
    await expect(page.locator('#import-save-error')).toBeVisible();
    await expect(page.getByText('Archivo de guardado no válido')).toBeVisible();

    // 6. Verificar que la partida no fue alterada
    await page.goto('/dashboard/');
    await expect(page.getByText('Director Intacto')).toBeVisible();
  });
});
