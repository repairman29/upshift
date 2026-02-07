// @ts-check
// Browser e2e: homepage, Radar, docs, mobile nav. Requires: npm run serve:web (or run via playwright webServer).
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('has hero and main links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/stop reading changelogs|Stop reading changelogs/i);
    // On mobile, nav links are in hamburger menu — open it so Sign in link is in DOM
    const toggle = page.getByRole('button', { name: /toggle menu/i });
    if (await toggle.isVisible()) await toggle.click();
    await expect(page.getByRole('link', { name: /radar/i }).first()).toHaveAttribute('href', /\/radar/);
    await expect(page.getByRole('link', { name: /docs/i }).first()).toHaveAttribute('href', /\/docs\/?/);
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toHaveAttribute('href', /api\.upshiftai\.dev/);
  });

  test('has Product Hunt banner when present', async ({ page }) => {
    await page.goto('/');
    const ph = page.getByRole('link', { name: /product hunt/i });
    await expect(ph).toBeVisible();
    await expect(ph).toHaveAttribute('href', /producthunt\.com/);
  });

  test('no critical console errors', async ({ page }) => {
    const errors = [];
    const ignore = /plausible|ResizeObserver|CORS|waitlist|Access-Control|Failed to load resource|net::ERR_/i;
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && text && !ignore.test(text)) {
        errors.push(text);
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

test.describe('Radar', () => {
  test('Radar page loads and has free tier CTA', async ({ page }) => {
    await page.goto('/radar/');
    await expect(page.getByRole('heading', { name: /radar/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /load report/i })).toBeVisible();
    await expect(page.getByText(/Radar Pro/i).first()).toBeVisible();
  });

  test('Radar has Load my reports for Pro', async ({ page }) => {
    await page.goto('/radar/');
    await expect(page.getByRole('button', { name: /load my reports/i })).toBeVisible();
  });
});

test.describe('Docs', () => {
  test('Docs index lists main docs', async ({ page }) => {
    await page.goto('/docs/');
    await expect(page.getByRole('heading', { name: /documentation/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /user guide/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /CLI reference/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /configuration/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /radar/i }).first()).toBeVisible();
  });

  test('User guide page loads', async ({ page }) => {
    await page.goto('/docs/user-guide.html');
    await expect(page.getByRole('heading', { name: /user guide/i })).toBeVisible();
  });

  test('Docs nav links point to /docs/', async ({ page }) => {
    await page.goto('/docs/');
    const docsLink = page.getByRole('link', { name: /^docs$/i }).first();
    await expect(docsLink).toHaveAttribute('href', /\/docs\/?/);
  });

  test('Configuration doc page loads', async ({ page }) => {
    await page.goto('/docs/configuration.html');
    await expect(page.getByRole('heading', { name: /configuration reference/i })).toBeVisible();
  });

  test('Radar doc page loads', async ({ page }) => {
    await page.goto('/docs/radar.html');
    await expect(page.getByRole('heading', { name: /radar/i }).first()).toBeVisible();
  });

  test('Access & auth page loads', async ({ page }) => {
    await page.goto('/docs/access-and-auth.html');
    await expect(page.getByRole('heading', { name: /access & auth/i })).toBeVisible();
    await expect(page.getByText(/use the tools/i).first()).toBeVisible();
  });
});

test.describe('Start page', () => {
  test('Get started page loads', async ({ page }) => {
    await page.goto('/start.html');
    await expect(page.getByRole('heading', { name: /get started/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /pricing/i }).first()).toBeVisible();
  });
});

test.describe('Blog', () => {
  test('Blog index loads and lists posts', async ({ page }) => {
    await page.goto('/blog/index.html');
    await expect(page.getByRole('heading', { name: /blog/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /new additions|when it breaks|introducing|how we do hitl/i }).first()).toBeVisible();
  });
});

test.describe('Mobile nav', () => {
  test.use({ viewport: { width: 375, height: 667 }, isMobile: true });

  test('hamburger opens nav and shows links', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /toggle menu/i });
    await expect(toggle).toBeVisible();
    // Nav links should be hidden until open (or collapsed)
    await toggle.click();
    await expect(page.getByRole('link', { name: /demo/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /radar/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /docs/i }).first()).toBeVisible();
  });
});

test.describe('404', () => {
  test('404 page has back link', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.getByRole('heading', { name: /404/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to upshift/i })).toBeVisible();
  });
});
