import { chromium } from 'playwright';

const BROWSER_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({
  executablePath: BROWSER_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://localhost:3456', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/dash_synthese.png', fullPage: false });
console.log('✓ Synthèse');

// Carte
await page.click('button:has-text("🗺")');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/dash_carte.png', fullPage: false });
console.log('✓ Carte');

// Classement
await page.click('button:has-text("🏆")');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/dash_classement.png', fullPage: false });
console.log('✓ Classement');

// Données
await page.click('button:has-text("📋")');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/dash_donnees.png', fullPage: false });
console.log('✓ Données');

// Surfaces
await page.click('button:has-text("📐")');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/dash_surfaces.png', fullPage: false });
console.log('✓ Surfaces');

await browser.close();
console.log('Done');
