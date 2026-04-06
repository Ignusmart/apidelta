import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ── Navigation ──

  test('renders nav with logo, links, and CTA', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    await expect(nav.getByText('APIDelta')).toBeVisible();
    await expect(nav.getByRole('link', { name: /features/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /pricing/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /faq/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /start free trial/i })).toBeVisible();
  });

  test('sign-in link navigates to /sign-in', async ({ page }) => {
    await page.locator('nav').first().getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('start free trial button navigates to /sign-up', async ({ page }) => {
    await page.locator('nav').first().getByRole('link', { name: /start free trial/i }).click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  // ── Hero section ──

  test('renders hero headline and subheadline', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /know about breaking/i })).toBeVisible();
    await expect(page.getByText(/third-party APIs ship breaking changes/i)).toBeVisible();
  });

  test('hero has primary CTA linking to /sign-up', async ({ page }) => {
    const heroCta = page.getByRole('link', { name: /monitor your first api free/i }).first();
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute('href', '/sign-up');
  });

  test('hero has secondary CTA linking to how-it-works', async ({ page }) => {
    const secondaryCta = page.getByRole('link', { name: /see how it works/i });
    await expect(secondaryCta).toBeVisible();
    await expect(secondaryCta).toHaveAttribute('href', '#how-it-works');
  });

  test('hero shows trust signals', async ({ page }) => {
    await expect(page.getByText(/no credit card required/i).first()).toBeVisible();
    await expect(page.getByText(/14-day free trial/i).first()).toBeVisible();
  });

  // ── Social proof strip ──

  test('renders social proof with API brand names', async ({ page }) => {
    // Social proof section lists API brand names as span elements
    const socialProof = page.getByText(/monitors changelogs from apis/i).locator('..');
    await expect(socialProof).toBeVisible();
    await expect(page.getByText('Stripe', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Twilio', { exact: true })).toBeVisible();
    await expect(page.getByText('OpenAI', { exact: true })).toBeVisible();
  });

  // ── Features section ──

  test('renders features section with all 6 features', async ({ page }) => {
    const features = page.locator('#features');
    await expect(features).toBeVisible();
    await expect(features.getByText('AI-Powered Classification')).toBeVisible();
    await expect(features.getByText('Slack and Email Alerts')).toBeVisible();
    await expect(features.getByText('50+ Changelog Formats')).toBeVisible();
    await expect(features.getByText('Built for Teams')).toBeVisible();
    await expect(features.getByText('Hourly Monitoring')).toBeVisible();
    await expect(features.getByText('Full Audit Trail')).toBeVisible();
  });

  // ── How it works ──

  test('renders how-it-works section with 3 steps', async ({ page }) => {
    const section = page.locator('#how-it-works');
    await expect(section).toBeVisible();
    await expect(section.getByText('Paste your changelog URLs')).toBeVisible();
    await expect(section.getByText('AI reads and classifies every update')).toBeVisible();
    await expect(section.getByText('Get alerted before things break')).toBeVisible();
  });

  // ── Pricing section ──

  test('renders pricing section with Starter and Pro plans', async ({ page }) => {
    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible();
    await expect(pricing.getByText('Starter')).toBeVisible();
    await expect(pricing.getByText('Pro')).toBeVisible();
    await expect(pricing.getByText('$49', { exact: true })).toBeVisible();
    await expect(pricing.getByText('$99', { exact: true })).toBeVisible();
    await expect(pricing.getByText('Most popular')).toBeVisible();
  });

  test('pricing CTAs link to /sign-up', async ({ page }) => {
    const pricingCtas = page.locator('#pricing').getByRole('link', { name: /start 14-day free trial/i });
    const count = await pricingCtas.count();
    expect(count).toBe(2);
    for (let i = 0; i < count; i++) {
      await expect(pricingCtas.nth(i)).toHaveAttribute('href', '/sign-up');
    }
  });

  // ── FAQ section ──

  test('renders FAQ section with expandable questions', async ({ page }) => {
    const faq = page.locator('#faq');
    await expect(faq).toBeVisible();
    await expect(faq.getByText('What APIs can APIDelta monitor?')).toBeVisible();
    await expect(faq.getByText('How does the AI classification work?')).toBeVisible();
  });

  test('FAQ accordion expands on click', async ({ page }) => {
    const faq = page.locator('#faq');
    const firstQuestion = faq.locator('details').first();
    const answer = firstQuestion.locator('div');

    // Initially the answer content should not be visible
    await expect(answer).not.toBeVisible();

    // Click the summary to expand
    await firstQuestion.locator('summary').click();
    await expect(answer).toBeVisible();
  });

  // ── CTA banner ──

  test('renders final CTA banner', async ({ page }) => {
    await expect(page.getByText('Your next API outage is preventable.')).toBeVisible();
  });

  // ── Footer ──

  test('renders footer with logo, nav, and copyright', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText('APIDelta', { exact: true })).toBeVisible();
    await expect(footer.getByText(/all rights reserved/i)).toBeVisible();
  });

  // ── Structured data ──

  test('page has FAQ structured data', async ({ page }) => {
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(1);

    let foundFaq = false;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('FAQPage')) {
        foundFaq = true;
        const json = JSON.parse(content);
        expect(json['@type']).toBe('FAQPage');
        expect(json.mainEntity.length).toBeGreaterThan(0);
      }
    }
    expect(foundFaq).toBe(true);
  });

  test('page has Organization structured data', async ({ page }) => {
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();

    let found = false;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('"Organization"')) {
        found = true;
        const json = JSON.parse(content);
        expect(json['@type']).toBe('Organization');
        expect(json.name).toBe('APIDelta');
      }
    }
    expect(found).toBe(true);
  });

  // ── Responsive ──

  test('mobile nav hides desktop links but keeps CTA', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    // Desktop nav links (Features, Pricing, FAQ) should be hidden on mobile
    const featuresLink = page.locator('nav').first().getByRole('link', { name: /features/i });
    await expect(featuresLink).toBeHidden();
    // But the CTA button should still be visible
    await expect(page.locator('nav').first().getByRole('link', { name: /start free trial/i })).toBeVisible();
  });
});
