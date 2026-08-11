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

test('unauthenticated user is redirected to login from protected admin route', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/auth/);
});

test('unauthenticated user is redirected to login from protected teacher route', async ({ page }) => {
  await page.goto('/teacher');
  await expect(page).toHaveURL(/\/auth/);
});

test('unauthenticated user is redirected to login from protected student route', async ({ page }) => {
  await page.goto('/student');
  await expect(page).toHaveURL(/\/auth/);
});

test('login page renders the sign in form', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(page.getByLabel(/Password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
});

test('login page shows create account link', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('link', { name: /Create one/i })).toBeVisible();
});