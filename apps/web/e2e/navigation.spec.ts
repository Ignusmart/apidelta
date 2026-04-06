import { test, expect } from '@playwright/test';

test.describe('Navigation and routing', () => {
  test('landing page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/apidelta/i);
  });

  test('navigating from landing to sign-in and back', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').first().getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);

    // Navigate back to home via logo
    await page.getByRole('link', { name: /apidelta/i }).first().click();
    await expect(page).toHaveURL('/');
  });

  test('navigating from sign-in to sign-up and back', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByRole('link', { name: /start free trial/i }).click();
    await expect(page).toHaveURL(/\/sign-up/);

    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('landing page anchor links scroll to sections', async ({ page }) => {
    await page.goto('/');

    // Click features link
    await page.locator('nav').first().getByRole('link', { name: /features/i }).click();
    await expect(page).toHaveURL(/#features/);

    // Click pricing link
    await page.locator('nav').first().getByRole('link', { name: /pricing/i }).click();
    await expect(page).toHaveURL(/#pricing/);

    // Click FAQ link
    await page.locator('nav').first().getByRole('link', { name: /faq/i }).click();
    await expect(page).toHaveURL(/#faq/);
  });

  test('footer links point to correct sections', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    await expect(footer.getByRole('link', { name: /features/i })).toHaveAttribute('href', '#features');
    await expect(footer.getByRole('link', { name: /pricing/i })).toHaveAttribute('href', '#pricing');
    await expect(footer.getByRole('link', { name: /faq/i })).toHaveAttribute('href', '#faq');
  });

  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
  });

  test('sitemap.xml is accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
  });
});
