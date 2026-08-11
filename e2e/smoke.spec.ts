import { expect, test } from '@playwright/test';

test('home page renders the foundation heading', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /English Learning Platform/i }),
  ).toBeVisible();
});

test('unknown route shows the 404 page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: /Page not found/i })).toBeVisible();
});