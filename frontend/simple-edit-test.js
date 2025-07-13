const puppeteer = require('puppeteer');

async function simpleEditTest() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Going to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('Logging in...');
    await page.type('input[placeholder="Username"]', 'Mary');
    await page.type('input[placeholder="Password"]', 'SpareQueen!');
    await page.click('button');
    await page.waitForTimeout(3000);
    
    console.log('Looking for main menu...');
    const mainMenu = await page.$('.main-menu');
    if (mainMenu) {
      console.log('✓ Main menu found');
      
      console.log('Looking for Edit Scores menu item...');
      const menuItems = await page.$$('.menu-item .menu-label');
      const menuTexts = await Promise.all(menuItems.map(item => 
        page.evaluate(el => el.textContent, item)
      ));
      
      console.log('Menu items found:', menuTexts);
      
      if (menuTexts.includes('Edit Scores')) {
        console.log('✓ Edit Scores menu item found');
        
        // Navigate to Edit Scores
        await page.keyboard.press('ArrowDown'); // Enter Scores
        await page.keyboard.press('ArrowDown'); // Scrape Scores  
        await page.keyboard.press('ArrowDown'); // Edit Scores
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        console.log('Checking Edit Scores page...');
        const pageTitle = await page.$('h2');
        if (pageTitle) {
          const titleText = await page.evaluate(el => el.textContent, pageTitle);
          console.log('Page title:', titleText);
          
          if (titleText.includes('Edit Scores')) {
            console.log('✓ Edit Scores page loaded successfully');
            
            // Check if games list exists
            const gamesList = await page.$('.games-list');
            if (gamesList) {
              console.log('✓ Games list found');
            } else {
              console.log('⚠ No games list found (might be empty)');
            }
            
            // Check for "No games found" message
            const noGamesMessage = await page.$eval('body', el => el.textContent);
            if (noGamesMessage.includes('No games found')) {
              console.log('✓ "No games found" message displayed correctly');
            }
            
          } else {
            console.log('✗ Wrong page - title is:', titleText);
          }
        } else {
          console.log('✗ No page title found');
        }
      } else {
        console.log('✗ Edit Scores menu item not found');
      }
    } else {
      console.log('✗ Main menu not found');
    }
    
    console.log('Test completed - keeping browser open for inspection');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

simpleEditTest();