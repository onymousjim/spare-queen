const puppeteer = require('puppeteer');

async function testCameraFunctionality() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser to see camera interface
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream', // Automatically allow camera access
      '--use-fake-device-for-media-stream', // Use fake camera
      '--use-file-for-fake-video-capture=/dev/video0' // Use system camera if available
    ]
  });
  
  const page = await browser.newPage();
  
  // Grant camera permissions
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('http://localhost:3000', ['camera']);
  
  try {
    console.log('🎬 Testing Camera Functionality...');
    console.log('📍 Going to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('🔐 Logging in...');
    await page.type('input[placeholder="Username"]', 'Mary');
    await page.type('input[placeholder="Password"]', 'SpareQueen!');
    
    // Click the Login button specifically (not View Password)
    const loginButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent.includes('Login'));
    });
    
    if (loginButton.asElement()) {
      await loginButton.asElement().click();
      console.log('✓ Clicked Login button');
    } else {
      console.log('✗ Login button not found');
    }
    
    // Wait for navigation or error message
    try {
      // Wait for either menu items to appear (successful login) or error message
      await Promise.race([
        page.waitForSelector('.menu-item', { timeout: 5000 }),
        page.waitForSelector('.error-message', { timeout: 5000 })
      ]);
    } catch (e) {
      console.log('⚠ Timeout waiting for login response');
    }
    
    // Debug login state
    console.log('Checking login state...');
    const bodyContent = await page.evaluate(() => document.body.textContent);
    console.log('Page contains "Spare Queen":', bodyContent.includes('Spare Queen'));
    console.log('Page contains "Enter Scores":', bodyContent.includes('Enter Scores'));
    console.log('Page contains login form:', bodyContent.includes('Username'));
    console.log('Page contains error:', bodyContent.includes('Invalid credentials'));
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-after-login.png' });
    
    console.log('🧭 Navigating to Image Upload...');
    
    // Wait for menu items to be visible
    await page.waitForSelector('.menu-item', { timeout: 5000 });
    
    // Find and click the "Scrape Scores" menu item directly
    const menuItems = await page.$$('.menu-item');
    let scrapeScoresButton = null;
    
    for (const item of menuItems) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text.includes('Scrape Scores')) {
        scrapeScoresButton = item;
        break;
      }
    }
    
    if (scrapeScoresButton) {
      console.log('✓ Found Scrape Scores menu item, clicking...');
      await scrapeScoresButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('✗ Scrape Scores menu item not found');
    }
    
    console.log('📷 Looking for Take Photo button...');
    // Check page content to debug
    const pageTitle = await page.$('h2');
    if (pageTitle) {
      const titleText = await page.evaluate(el => el.textContent, pageTitle);
      console.log('Page title:', titleText);
    }
    
    // Also check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we're on the image upload page by looking for specific elements
    const imageUploadContainer = await page.$('.image-upload-container');
    console.log('Image upload container found:', !!imageUploadContainer);
    
    // Look for button by text content
    const buttons = await page.$$('button');
    let takePhotoButton = null;
    
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Take Photo')) {
        takePhotoButton = button;
        break;
      }
    }
    
    if (takePhotoButton) {
      console.log('✓ Take Photo button found');
      
      await takePhotoButton.click();
      await page.waitForTimeout(2000);
      
      console.log('🎥 Checking for camera modal...');
      const cameraModal = await page.$('.camera-modal');
      if (cameraModal) {
        console.log('✓ Camera modal opened successfully');
        
        // Check for video element
        const video = await page.$('.camera-modal video');
        if (video) {
          console.log('✓ Video preview element found');
        } else {
          console.log('✗ Video preview element not found');
        }
        
        // Check for camera controls
        const snapButton = await page.$('.snap-button');
        const backButton = await page.$('.back-button');
        
        if (snapButton && backButton) {
          console.log('✓ Camera controls found (Snap Photo and Back buttons)');
          
          console.log('📸 Testing Snap Photo functionality...');
          await snapButton.click();
          await page.waitForTimeout(1000);
          
          // Check if camera modal closed
          const modalClosed = await page.$('.camera-modal') === null;
          if (modalClosed) {
            console.log('✓ Camera modal closed after snap');
            
            // Check for image preview
            const imagePreview = await page.$('.image-preview');
            if (imagePreview) {
              console.log('✓ Image preview displayed');
              
              const previewTitle = await page.$eval('.image-preview h3', el => el.textContent);
              if (previewTitle.includes('Photo Captured!')) {
                console.log('✓ Correct preview title shown');
              }
              
              // Check for process button
              const processButton = await page.$('.process-button');
              if (processButton) {
                console.log('✓ Process Image button available');
                
                // Check for "Take Another" button
                const retakeButton = await page.$('.retake-button');
                if (retakeButton) {
                  console.log('✓ Take Another button available');
                } else {
                  console.log('⚠ Take Another button not found');
                }
                
                console.log('🧪 Testing complete camera flow works!');
              } else {
                console.log('✗ Process Image button not found');
              }
            } else {
              console.log('✗ Image preview not displayed');
            }
          } else {
            console.log('✗ Camera modal did not close after snap');
          }
        } else {
          console.log('✗ Camera controls not found');
        }
      } else {
        console.log('✗ Camera modal did not open');
      }
    } else {
      console.log('✗ Take Photo button not found');
    }
    
    console.log('🏁 Test completed - keeping browser open for 5 seconds');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Error during camera test:', error);
  } finally {
    await browser.close();
  }
}

testCameraFunctionality();