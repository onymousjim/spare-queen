const puppeteer = require('puppeteer');

async function runTests() {
  let browser;
  let page;
  const CATCH_ALL_ERRORS = [];

  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorText = `Console Error: ${msg.text()}`;
        console.error(errorText);
        CATCH_ALL_ERRORS.push(errorText);
      }
    });

    // Test Login Flow
    console.log('Testing Login Flow...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Check login form exists
    const usernameInput = await page.$('input[placeholder="Username"]');
    const passwordInput = await page.$('input[placeholder="Password"]');
    const loginButton = await page.$('button');
    
    if (!usernameInput || !passwordInput || !loginButton) {
      CATCH_ALL_ERRORS.push('Login form elements not found');
      console.log('Page content:', await page.content());
    } else {
      console.log('Login form found, attempting login...');
      
      // Clear and type credentials
      await page.evaluate(() => {
        const usernameField = document.querySelector('input[placeholder="Username"]');
        const passwordField = document.querySelector('input[placeholder="Password"]');
        if (usernameField) usernameField.value = '';
        if (passwordField) passwordField.value = '';
      });
      
      await page.type('input[placeholder="Username"]', 'Mary');
      await page.type('input[placeholder="Password"]', 'SpareQueen!');
      await page.click('button');
      await page.waitForTimeout(3000);
      
      // Check if main menu appeared (indicates successful login)
      const mainMenu = await page.$('.main-menu');
      if (!mainMenu) {
        CATCH_ALL_ERRORS.push('Login failed - main menu not visible after login');
      } else {
        console.log('✓ Login successful');
        
        // Test keyboard navigation
        console.log('Testing keyboard navigation...');
        
        // Test arrow down navigation
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(500);
        
        // Check if second item is selected
        const selectedItems = await page.$$('.menu-item.selected');
        if (selectedItems.length === 1) {
          const selectedText = await page.evaluate(el => el.textContent, selectedItems[0]);
          if (selectedText.includes('Image Upload')) {
            console.log('✓ Arrow down navigation working');
          } else {
            CATCH_ALL_ERRORS.push('Arrow down navigation not working correctly');
          }
        }
        
        // Test arrow up navigation
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(500);
        
        // Test Enter key navigation to Manual Entry
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // Test Manual Entry multi-step flow
        console.log('Testing Manual Entry multi-step flow...');
        await page.waitForTimeout(1000);
        
        // Step 1: Game Information
        const gameNameInput = await page.$('input[placeholder="Game Name"]');
        if (gameNameInput) {
          await page.type('input[placeholder="Game Name"]', 'Test Game');
          
          // Click Next button
          const buttons = await page.$$('button');
          for (const button of buttons) {
            const text = await page.evaluate(el => el.textContent, button);
            if (text.includes('Next')) {
              await button.click();
              break;
            }
          }
          await page.waitForTimeout(1000);
          
          // Step 2: Add Players
          const playerNameInput = await page.$('input[placeholder="Player Name"]');
          if (playerNameInput) {
            await page.type('input[placeholder="Player Name"]', 'John');
            await page.type('input[placeholder="Score"]', '150');
            
            // Click Add Player button
            const addButtons = await page.$$('button');
            for (const button of addButtons) {
              const text = await page.evaluate(el => el.textContent, button);
              if (text.includes('Add Player')) {
                await button.click();
                break;
              }
            }
            await page.waitForTimeout(500);
            
            // Add second player
            await page.evaluate(() => {
              const nameInput = document.querySelector('input[placeholder="Player Name"]');
              const scoreInput = document.querySelector('input[placeholder="Score"]');
              if (nameInput) nameInput.value = '';
              if (scoreInput) scoreInput.value = '';
            });
            
            await page.type('input[placeholder="Player Name"]', 'Jane');
            await page.type('input[placeholder="Score"]', '175');
            
            // Click Add Player again
            const addButtons2 = await page.$$('button');
            for (const button of addButtons2) {
              const text = await page.evaluate(el => el.textContent, button);
              if (text.includes('Add Player')) {
                await button.click();
                break;
              }
            }
            await page.waitForTimeout(500);
            
            // Click Continue button
            const continueButtons = await page.$$('button');
            for (const button of continueButtons) {
              const text = await page.evaluate(el => el.textContent, button);
              if (text.includes('Continue')) {
                await button.click();
                break;
              }
            }
            await page.waitForTimeout(1000);
            
            // Step 3: Review and Save
            const saveButtons = await page.$$('button');
            for (const button of saveButtons) {
              const text = await page.evaluate(el => el.textContent, button);
              if (text.includes('Save Game')) {
                await button.click();
                break;
              }
            }
            await page.waitForTimeout(1000);
            console.log('✓ Manual entry multi-step flow completed');
          }
        }
        
        // Since manual entry flow takes us back to main menu automatically,
        // let's verify we're at the main menu
        console.log('Verifying return to main menu...');
        const mainMenuCheck = await page.$('.main-menu');
        if (mainMenuCheck) {
          console.log('✓ Successfully returned to main menu');
        } else {
          CATCH_ALL_ERRORS.push('Did not return to main menu after save');
        }
        
        // Test Image Upload page via keyboard
        console.log('Testing Image Upload page...');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        const fileInput = await page.$('input[type="file"]');
        const buttons = await page.$$('button');
        let takePhotoButton = null;
        
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('Take Photo')) {
            takePhotoButton = button;
            break;
          }
        }
        
        if (fileInput && takePhotoButton) {
          console.log('✓ Image upload interface loaded');
        } else {
          CATCH_ALL_ERRORS.push('Image upload interface elements missing');
        }
        
        // Navigate back and test Metrics page
        console.log('Testing Metrics page...');
        const backButton2 = await page.$('.back-button');
        if (backButton2) {
          await backButton2.click();
          await page.waitForTimeout(1000);
        }
        
        // Navigate to metrics via keyboard
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        const metricsTitle = await page.$('h2');
        if (metricsTitle) {
          const titleText = await page.evaluate(el => el.textContent, metricsTitle);
          if (titleText.includes('Metrics')) {
            console.log('✓ Metrics page loaded');
          } else {
            CATCH_ALL_ERRORS.push('Metrics page title not found');
          }
        } else {
          CATCH_ALL_ERRORS.push('Metrics page did not load properly');
        }
      }
    }

  } catch (err) {
    console.error('An error occurred during the test run:', err);
    CATCH_ALL_ERRORS.push(err.toString());
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }

  if (CATCH_ALL_ERRORS.length > 0) {
    console.error('\n--- puppeteer tests failed ---');
    console.error(CATCH_ALL_ERRORS.join('\n'));
    process.exit(1);
  } else {
    console.log('\n--- puppeteer tests passed successfully! ---');
    process.exit(0);
  }
}

runTests();
