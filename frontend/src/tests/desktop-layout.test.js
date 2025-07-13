const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000');
  // Login
  await page.type('input[placeholder="Username"]', 'Mary');
  await page.type('input[placeholder="Password"]', 'SpareQueen!');
  await page.click('button');
  await page.waitForNavigation();

  // Navigate to "Image Upload" and take a screenshot.
  await page.goto('http://localhost:3000/image-upload');
  await page.waitForSelector('.image-upload-container');
  await page.screenshot({ path: 'frontend/src/tests/screenshots/desktop-image-upload.png' });
  console.log('📸 Screenshot of Image Upload page taken.');

  // Navigate to "Manual Entry" and take a screenshot.
  await page.goto('http://localhost:3000/manual-entry');
  await page.waitForSelector('.manual-entry-container');
  await page.screenshot({ path: 'frontend/src/tests/screenshots/desktop-manual-entry.png' });
  console.log('📸 Screenshot of Manual Entry page taken.');

  // Navigate to "Edit Scores" and take a screenshot.
  await page.goto('http://localhost:3000/edit-scores');
  await page.waitForSelector('.edit-scores-container');
  await page.screenshot({ path: 'frontend/src/tests/screenshots/desktop-edit-scores.png' });
  console.log('📸 Screenshot of Edit Scores page taken.');

  // Navigate to "Metrics" and take a screenshot.
  await page.goto('http://localhost:3000/metrics');
  await page.waitForSelector('.metrics-container');
  await page.screenshot({ path: 'frontend/src/tests/screenshots/desktop-metrics.png' });
  console.log('📸 Screenshot of Metrics page taken.');

  await browser.close();
})();
