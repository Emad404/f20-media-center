import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOTS_DIR = 'C:/Users/emada/OneDrive/Documents/F20-project/screenshots';
const BASE_URL = 'http://localhost:3000';

const pages = [
  { path: '/', name: '01-dashboard' },
  { path: '/events', name: '02-events' },
  { path: '/world-days', name: '03-world-days' },
  { path: '/exhibitions', name: '04-exhibitions' },
  { path: '/company-events', name: '05-company-events' },
  { path: '/social', name: '06-social' },
  { path: '/reports', name: '07-reports' },
  { path: '/predictions', name: '08-predictions' },
  { path: '/courses', name: '09-courses' },
  { path: '/employees', name: '10-employees' },
  { path: '/calendar', name: '11-calendar' },
];

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});

import { mkdirSync } from 'fs';
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

for (const { path: pagePath, name } of pages) {
  const page = await context.newPage();
  await page.goto(BASE_URL + pagePath, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(800);
  const file = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path: file, fullPage: false });
  console.log(`✓ ${name}`);
  await page.close();
}

await browser.close();
console.log('Done.');
