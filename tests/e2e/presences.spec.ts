import { test, expect } from '@playwright/test';

test.describe('PWA Prise de Présences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('charge l\'application et affiche le titre principal', async ({ page }) => {
    await expect(page).toHaveTitle(/Prise de Présences/);
    await expect(page.locator('.header-title')).toContainText('Prise de Présences');
  });

  test('navigue entre les différents écrans via la barre de navigation', async ({ page }) => {
    // Naviguer vers Aujourd'hui
    await page.click('button[data-route="#/jour"]');
    await expect(page.url()).toContain('#/jour');

    // Naviguer vers Élèves
    await page.click('button[data-route="#/eleves"]');
    await expect(page.url()).toContain('#/eleves');

    // Naviguer vers Historique
    await page.click('button[data-route="#/historique"]');
    await expect(page.url()).toContain('#/historique');
  });

  test('crée un élève et effectue un pointage', async ({ page }) => {
    // Aller sur Élèves
    await page.click('button[data-route="#/eleves"]');

    // Cliquer sur Ajouter
    await page.click('#eleves-add-btn');

    // Remplir le formulaire
    await page.fill('#form-first-name', 'Jean');
    await page.fill('#form-last-name', 'Testeur');
    await page.selectOption('#form-year-select', '1A');

    // Sauvegarder
    await page.click('button[type="submit"]');

    // Revenir sur Pointage
    await page.click('button[data-route="#/pointage"]');

    // Rechercher Jean
    await page.fill('#pointage-search', 'Jean');
    const card = page.locator('.student-card').first();
    await expect(card).toContainText('Jean Testeur');

    // Marquer présent
    await card.click();
    await expect(card).toHaveClass(/marked-present/);
  });
});
