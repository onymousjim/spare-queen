const puppeteer = require('puppeteer');

async function runEditScoresTest() {
  let browser;
  let page;
  const CATCH_ALL_ERRORS = [];

  try {
    console.log('Launching browser for Edit Scores test...');
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
    console.log('Logging in...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    
    // Login
    await page.type('input[placeholder="Username"]', 'Mary');
    await page.type('input[placeholder="Password"]', 'SpareQueen!');
    await page.click('button');
    await page.waitForTimeout(3000);
    
    // Check if main menu appeared
    const mainMenu = await page.$('.main-menu');
    if (!mainMenu) {
      CATCH_ALL_ERRORS.push('Login failed - main menu not visible');
      return;
    }

    console.log('✓ Login successful');

    // Test that Edit Scores appears in menu
    console.log('Testing Edit Scores menu item visibility...');
    const menuItems = await page.$$('.menu-item');
    let editScoresFound = false;
    
    for (const item of menuItems) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text.includes('Edit Scores')) {
        editScoresFound = true;
        break;
      }
    }
    
    if (!editScoresFound) {
      CATCH_ALL_ERRORS.push('Edit Scores menu item not found');
      return;
    }
    
    console.log('✓ Edit Scores menu item found');

    // Navigate to Edit Scores using keyboard
    console.log('Navigating to Edit Scores...');
    await page.keyboard.press('ArrowDown'); // Enter Scores
    await page.keyboard.press('ArrowDown'); // Scrape Scores
    await page.keyboard.press('ArrowDown'); // Edit Scores
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Check if Edit Scores page loaded
    const editScoresTitle = await page.$('h2');
    if (!editScoresTitle) {
      CATCH_ALL_ERRORS.push('Edit Scores page did not load - no h2 title found');
      return;
    }

    const titleText = await page.evaluate(el => el.textContent, editScoresTitle);
    if (!titleText.includes('Edit Scores')) {
      CATCH_ALL_ERRORS.push(`Edit Scores page title incorrect: ${titleText}`);
      return;
    }

    console.log('✓ Edit Scores page loaded successfully');

    // First, let's add a test game so we have something to edit
    console.log('Creating a test game first...');
    
    // Go back to main menu
    const backButton = await page.$('.back-button-manual');
    if (backButton) {
      await backButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to manual entry to create a test game
    await page.keyboard.press('Enter'); // Should select "Enter Scores"
    await page.waitForTimeout(2000);

    // Fill out the manual entry form
    const gameNameInput = await page.$('input[placeholder="Game Name"]');
    if (gameNameInput) {
      await page.type('input[placeholder="Game Name"]', 'Edit Test Game');
      
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
      
      // Add players
      await page.type('input[placeholder="Player Name"]', 'Alice');
      await page.type('input[placeholder="Score"]', '120');
      
      // Click Add Player
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
      
      await page.type('input[placeholder="Player Name"]', 'Bob');
      await page.type('input[placeholder="Score"]', '135');
      
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
      
      // Click Continue
      const continueButtons = await page.$$('button');
      for (const button of continueButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Continue')) {
          await button.click();
          break;
        }
      }
      await page.waitForTimeout(1000);
      
      // Save the game
      const saveButtons = await page.$$('button');
      for (const button of saveButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Save Game')) {
          await button.click();
          break;
        }
      }
      await page.waitForTimeout(2000);
      
      console.log('✓ Test game created successfully');
    }

    // Now navigate back to Edit Scores
    console.log('Navigating back to Edit Scores...');
    await page.keyboard.press('ArrowDown'); // Scrape Scores
    await page.keyboard.press('ArrowDown'); // Edit Scores
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Check if games are listed
    console.log('Testing game list display...');
    const gamesList = await page.$('.games-list');
    if (!gamesList) {
      CATCH_ALL_ERRORS.push('Games list not found on Edit Scores page');
      return;
    }

    // Look for our test game
    const gameItems = await page.$$('.games-list > div');
    let testGameFound = false;
    let testGameElement = null;
    
    for (const item of gameItems) {
      const gameText = await page.evaluate(el => el.textContent, item);
      if (gameText.includes('Edit Test Game')) {
        testGameFound = true;
        testGameElement = item;
        break;
      }
    }
    
    if (!testGameFound) {
      CATCH_ALL_ERRORS.push('Test game not found in games list');
      return;
    }
    
    console.log('✓ Test game found in games list');

    // Test Edit functionality
    console.log('Testing Edit functionality...');
    const editButton = await testGameElement.$('button');
    if (!editButton) {
      CATCH_ALL_ERRORS.push('Edit button not found for test game');
      return;
    }

    const buttonText = await page.evaluate(el => el.textContent, editButton);
    if (!buttonText.includes('Edit')) {
      CATCH_ALL_ERRORS.push('Expected Edit button but found: ' + buttonText);
      return;
    }

    await editButton.click();
    await page.waitForTimeout(2000);

    // Check if edit form appeared
    const editForm = await page.$('.edit-game-form');
    if (!editForm) {
      CATCH_ALL_ERRORS.push('Edit form did not appear');
      return;
    }

    console.log('✓ Edit form displayed successfully');

    // Test editing game name
    console.log('Testing game name editing...');
    const gameNameEditInput = await page.$('input[value="Edit Test Game"]');
    if (!gameNameEditInput) {
      CATCH_ALL_ERRORS.push('Game name input not found in edit form');
      return;
    }

    // Clear and update game name
    await page.evaluate(() => {
      const input = document.querySelector('input[value="Edit Test Game"]');
      if (input) {
        input.value = '';
      }
    });
    
    await page.type('input', 'Updated Test Game');

    // Test editing player data
    console.log('Testing player data editing...');
    const playerInputs = await page.$$('input');
    
    // Find Alice's score input and update it
    let aliceScoreInput = null;
    for (const input of playerInputs) {
      const value = await page.evaluate(el => el.value, input);
      if (value === '120') {
        aliceScoreInput = input;
        break;
      }
    }
    
    if (aliceScoreInput) {
      await page.evaluate(el => el.value = '', aliceScoreInput);
      await aliceScoreInput.type('125');
    }

    // Save the changes
    console.log('Testing save functionality...');
    const updateButtons = await page.$$('button');
    let updateButton = null;
    
    for (const button of updateButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Update Game')) {
        updateButton = button;
        break;
      }
    }
    
    if (!updateButton) {
      CATCH_ALL_ERRORS.push('Update Game button not found');
      return;
    }

    await updateButton.click();
    await page.waitForTimeout(2000);

    // Check if we're back to the games list
    const gamesListAfterUpdate = await page.$('.games-list');
    if (!gamesListAfterUpdate) {
      CATCH_ALL_ERRORS.push('Did not return to games list after update');
      return;
    }

    console.log('✓ Game updated and returned to list');

    // Verify the update took effect
    console.log('Verifying update took effect...');
    const updatedGameItems = await page.$$('.games-list > div');
    let updatedGameFound = false;
    
    for (const item of updatedGameItems) {
      const gameText = await page.evaluate(el => el.textContent, item);
      if (gameText.includes('Updated Test Game')) {
        updatedGameFound = true;
        break;
      }
    }
    
    if (!updatedGameFound) {
      CATCH_ALL_ERRORS.push('Updated game name not found in list');
      return;
    }
    
    console.log('✓ Game update verified successfully');

    // Test Delete functionality
    console.log('Testing Delete functionality...');
    
    // Find the updated game and its delete button
    let updatedGameElement = null;
    for (const item of updatedGameItems) {
      const gameText = await page.evaluate(el => el.textContent, item);
      if (gameText.includes('Updated Test Game')) {
        updatedGameElement = item;
        break;
      }
    }
    
    if (!updatedGameElement) {
      CATCH_ALL_ERRORS.push('Updated game element not found for deletion test');
      return;
    }

    const deleteButton = await updatedGameElement.$$('button');
    let actualDeleteButton = null;
    
    for (const button of deleteButton) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Delete')) {
        actualDeleteButton = button;
        break;
      }
    }
    
    if (!actualDeleteButton) {
      CATCH_ALL_ERRORS.push('Delete button not found');
      return;
    }

    // Handle the confirmation dialog
    page.on('dialog', async dialog => {
      console.log('Confirmation dialog appeared:', dialog.message());
      await dialog.accept();
    });

    await actualDeleteButton.click();
    await page.waitForTimeout(2000);

    // Verify the game was deleted
    console.log('Verifying game deletion...');
    const finalGameItems = await page.$$('.games-list > div');
    let deletedGameStillExists = false;
    
    for (const item of finalGameItems) {
      const gameText = await page.evaluate(el => el.textContent, item);
      if (gameText.includes('Updated Test Game')) {
        deletedGameStillExists = true;
        break;
      }
    }
    
    if (deletedGameStillExists) {
      CATCH_ALL_ERRORS.push('Game was not deleted - still appears in list');
      return;
    }
    
    console.log('✓ Game deleted successfully');

  } catch (err) {
    console.error('An error occurred during the Edit Scores test run:', err);
    CATCH_ALL_ERRORS.push(err.toString());
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }

  if (CATCH_ALL_ERRORS.length > 0) {
    console.error('\n--- Edit Scores tests failed ---');
    console.error(CATCH_ALL_ERRORS.join('\n'));
    process.exit(1);
  } else {
    console.log('\n--- Edit Scores tests passed successfully! ---');
    process.exit(0);
  }
}

runEditScoresTest();