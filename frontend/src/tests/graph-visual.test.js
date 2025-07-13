const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  // Login to the application
  await page.goto('http://localhost:3000');
  await page.type('input[placeholder="Username"]', 'Mary');
  await page.type('input[placeholder="Password"]', 'SpareQueen!');
  await page.click('button');
  await page.waitForNavigation();

  // Navigate directly to a player's stats page
  // We need to pass state, so we'll do it via an intermediate navigation
  await page.goto('http://localhost:3000/metrics');
  await page.waitForSelector('.players-ranking-section');
  
  // Find and click the link for the player 'MARY'
  const playerLinkSelector = 'a[href="/player/MARY"]';
  await page.waitForSelector(playerLinkSelector);
  await page.click(playerLinkSelector);

  // Wait for the player stats page to load
  await page.waitForSelector('.graph-container');
  
  // Give graph animations time to settle
  await new Promise(resolve => setTimeout(resolve, 500));

  await page.screenshot({ path: 'frontend/src/tests/screenshots/player-stats-graph.png' });
  console.log('📸 Screenshot of Player Stats graph taken.');

  await browser.close();
})();
