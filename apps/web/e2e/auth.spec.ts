import { test, expect } from '@playwright/test';

test.describe('Auth pages', () => {
  // ── Sign-in page ──

  test.describe('Sign-in page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/sign-in');
    });

    test('renders sign-in form with heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
      await expect(page.getByText(/sign in to your apidelta account/i)).toBeVisible();
    });

    test('shows APIDelta logo linking to home', async ({ page }) => {
      const logo = page.getByRole('link', { name: /apidelta/i }).first();
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('href', '/');
    });

    test('renders GitHub OAuth button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
    });

    test('renders email magic link form', async ({ page }) => {
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send sign-in link/i })).toBeVisible();
    });

    test('email input has correct type and autocomplete', async ({ page }) => {
      const emailInput = page.getByLabel(/email address/i);
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });

    test('has link to sign-up page', async ({ page }) => {
      const signUpLink = page.getByRole('link', { name: /start free trial/i });
      await expect(signUpLink).toBeVisible();
      await expect(signUpLink).toHaveAttribute('href', '/sign-up');
    });

    // NextAuth routes error params through its own error page handler.
    // The auth config maps error page to /sign-in, so NextAuth redirects
    // error=X to /sign-in?error=X. We test the ones that reliably render
    // the error query param on the sign-in page.

    test('shows error message for AccessDenied error', async ({ page }) => {
      await page.goto('/sign-in?error=AccessDenied');
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/access denied/i)).toBeVisible();
    });

    test('shows generic error message for unknown error', async ({ page }) => {
      await page.goto('/sign-in?error=SomethingElse');
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/something went wrong/i)).toBeVisible();
    });

    test('shows terms and privacy links', async ({ page }) => {
      await expect(page.getByRole('link', { name: /terms of service/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /privacy policy/i })).toBeVisible();
    });
  });

  // ── Sign-up page ──

  test.describe('Sign-up page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/sign-up');
    });

    test('renders sign-up form with heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /start monitoring in 2 minutes/i })).toBeVisible();
      await expect(page.getByText(/14-day free trial/i).first()).toBeVisible();
    });

    test('shows APIDelta logo linking to home', async ({ page }) => {
      const logo = page.getByRole('link', { name: /apidelta/i }).first();
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('href', '/');
    });

    test('renders GitHub OAuth button with helper text', async ({ page }) => {
      await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
      await expect(page.getByText(/fastest option/i)).toBeVisible();
    });

    test('renders email magic link form', async ({ page }) => {
      await expect(page.getByLabel(/work email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send sign-up link/i })).toBeVisible();
    });

    test('email input has autofocus', async ({ page }) => {
      const emailInput = page.getByLabel(/work email/i);
      await expect(emailInput).toHaveAttribute('autofocus', '');
    });

    test('has link to sign-in page', async ({ page }) => {
      const signInLink = page.getByRole('link', { name: /sign in/i });
      await expect(signInLink).toBeVisible();
      await expect(signInLink).toHaveAttribute('href', '/sign-in');
    });

    test('shows trust signals below form', async ({ page }) => {
      // Trust signals use short icon+text combos
      await expect(page.getByText('No credit card', { exact: true })).toBeVisible();
      await expect(page.getByText('Setup in 2 min')).toBeVisible();
      await expect(page.getByText('Team-ready')).toBeVisible();
    });

    test('shows error message for OAuthAccountNotLinked error', async ({ page }) => {
      await page.goto('/sign-up?error=OAuthAccountNotLinked');
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/already linked to a different sign-in method/i)).toBeVisible();
    });
  });

  // ── Verify request page ──

  test.describe('Verify request page', () => {
    test('renders verify request page', async ({ page }) => {
      await page.goto('/verify-request');
      // This page should render successfully
      await expect(page).toHaveURL(/\/verify-request/);
    });
  });

  // ── Dashboard auth redirect ──
  // The middleware uses NextAuth which redirects unauthenticated requests.
  // With no valid DB/session, this may redirect or error depending on env.
  // We test that the dashboard is not directly accessible.

  test.describe('Auth protection', () => {
    test('dashboard is not accessible without auth', async ({ page }) => {
      const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      // Either redirects to sign-in or returns an auth error
      const url = page.url();
      const isProtected = url.includes('/sign-in') || url.includes('/api/auth') || (response?.status() ?? 0) >= 400;
      expect(isProtected).toBe(true);
    });

    test('dashboard/sources is not accessible without auth', async ({ page }) => {
      const response = await page.goto('/dashboard/sources', { waitUntil: 'domcontentloaded' });
      const url = page.url();
      const isProtected = url.includes('/sign-in') || url.includes('/api/auth') || (response?.status() ?? 0) >= 400;
      expect(isProtected).toBe(true);
    });

    test('dashboard/alerts is not accessible without auth', async ({ page }) => {
      const response = await page.goto('/dashboard/alerts', { waitUntil: 'domcontentloaded' });
      const url = page.url();
      const isProtected = url.includes('/sign-in') || url.includes('/api/auth') || (response?.status() ?? 0) >= 400;
      expect(isProtected).toBe(true);
    });

    test('dashboard/changes is not accessible without auth', async ({ page }) => {
      const response = await page.goto('/dashboard/changes', { waitUntil: 'domcontentloaded' });
      const url = page.url();
      const isProtected = url.includes('/sign-in') || url.includes('/api/auth') || (response?.status() ?? 0) >= 400;
      expect(isProtected).toBe(true);
    });

    test('dashboard/settings is not accessible without auth', async ({ page }) => {
      const response = await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
      const url = page.url();
      const isProtected = url.includes('/sign-in') || url.includes('/api/auth') || (response?.status() ?? 0) >= 400;
      expect(isProtected).toBe(true);
    });
  });
});
