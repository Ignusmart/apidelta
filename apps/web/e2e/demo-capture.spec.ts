/**
 * Playwright script for capturing demo screenshots/frames for GIF creation.
 *
 * Usage:
 *   cd apps/web
 *   pnpm exec playwright test e2e/demo-capture.spec.ts --headed
 *
 * Screenshots saved to: apps/web/e2e/demo-screenshots/
 *
 * After running, stitch frames into a GIF with:
 *   ffmpeg -framerate 2 -pattern_type glob -i 'e2e/demo-screenshots/*.png' \
 *     -vf "scale=1280:-1:flags=lanczos" -loop 0 demo.gif
 *
 * Or use gifski for better quality:
 *   gifski --fps 2 --width 1280 -o demo.gif e2e/demo-screenshots/*.png
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, 'demo-screenshots');
const DEMO_URL = 'http://localhost:3000';

let step = 0;

async function capture(page: Page, name: string) {
  step++;
  const filename = `${String(step).padStart(2, '0')}-${name}.png`;
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: false,
  });
}

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

test.describe('Demo GIF Capture', () => {
  test.beforeAll(async () => {
    const fs = await import('fs');
    // Clean up old screenshots
    if (fs.existsSync(SCREENSHOT_DIR)) {
      fs.rmSync(SCREENSHOT_DIR, { recursive: true });
    }
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test('capture full demo flow', async ({ page }) => {
    // Set viewport to a nice 16:9 ratio for the GIF
    await page.setViewportSize({ width: 1280, height: 720 });

    // ── 1. Landing page hero ──
    await page.goto(DEMO_URL);
    await page.waitForLoadState('networkidle');
    await wait(500);
    await capture(page, 'landing-hero');

    // Scroll to "How it works" section
    await page.evaluate(() => {
      const el = document.querySelector('#how-it-works') ??
        document.querySelectorAll('h2')[1]; // fallback: second h2
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await wait(800);
    await capture(page, 'landing-how-it-works');

    // Scroll to Slack alert preview
    await page.evaluate(() => {
      const el = document.querySelector('[class*="slack"]') ??
        Array.from(document.querySelectorAll('div')).find(
          (d) => d.textContent?.includes('APIDelta') && d.textContent?.includes('BREAKING'),
        );
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await wait(800);
    await capture(page, 'landing-alert-preview');

    // ── 2. Dashboard overview (demo mode) ──
    await page.goto(`${DEMO_URL}/dashboard?demo=true`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    await capture(page, 'dashboard-overview');

    // ── 3. Sources page ──
    await page.goto(`${DEMO_URL}/dashboard/sources?demo=true`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    await capture(page, 'sources-list');

    // ── 4. Changes page — the money shot ──
    await page.goto(`${DEMO_URL}/dashboard/changes?demo=true`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    await capture(page, 'changes-list');

    // Click on the first critical change to open detail panel
    const firstChange = page.locator('button', { hasText: 'Payment Intents' }).first();
    if (await firstChange.isVisible()) {
      await firstChange.click();
      await wait(400);
      await capture(page, 'change-detail-panel');

      // Close the panel
      const closeBtn = page.locator('[aria-label="Close"]').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await wait(300);
      }
    }

    // ── 5. Alerts page — rules tab ──
    await page.goto(`${DEMO_URL}/dashboard/alerts?demo=true`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    await capture(page, 'alerts-rules');

    // Switch to history tab
    const historyTab = page.locator('button', { hasText: 'History' }).first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await wait(400);
      await capture(page, 'alerts-history');
    }

    // ── Done ──
    console.log(`\n✅ ${step} screenshots captured in: ${SCREENSHOT_DIR}\n`);
  });
});
