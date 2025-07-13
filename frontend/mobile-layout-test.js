const puppeteer = require('puppeteer');

async function testMobileLayout() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser to see layout
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set Pixel 9 Pro dimensions (393x852 logical pixels)
  await page.setViewport({
    width: 393,
    height: 852,
    deviceScaleFactor: 2.8,
    isMobile: true,
    hasTouch: true
  });
  
  // Grant camera permissions
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('http://localhost:5000', ['camera']);
  
  try {
    console.log('📱 Testing Mobile Layout on Pixel 9 Pro dimensions...');
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });
    
    // Login
    console.log('🔐 Logging in...');
    await page.type('input[placeholder="Username"]', 'Mary');
    await page.type('input[placeholder="Password"]', 'SpareQueen!');
    const loginButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent.includes('Login'));
    });
    await loginButton.asElement().click();
    await page.waitForSelector('.menu-item', { timeout: 5000 });
    
    // Navigate to Image Upload
    console.log('🧭 Navigating to Scrape Scores...');
    const menuItems = await page.$$('.menu-item');
    for (const item of menuItems) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text.includes('Scrape Scores')) {
        await item.click();
        break;
      }
    }
    await page.waitForTimeout(1000);
    
    console.log('📸 Testing Take Photo and Layout...');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'mobile-initial.png', fullPage: true });
    console.log('✓ Screenshot saved: mobile-initial.png');
    
    // Check Upload Photo button position and styling
    const uploadButton = await page.$('.upload-photo-btn');
    if (uploadButton) {
      const uploadRect = await uploadButton.boundingBox();
      console.log('📤 Upload Photo button position:', uploadRect);
    }
    
    // Simulate taking a photo by directly setting a file
    console.log('🎯 Simulating photo capture...');
    await page.evaluate(() => {
      // Create a fake file object
      const file = new File(['fake-image-data'], 'captured-image.jpg', { type: 'image/jpeg' });
      
      // Get the file input and trigger change
      const fileInput = document.getElementById('file-upload');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      
      // Trigger change event
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
    });
    
    await page.waitForTimeout(2000);
    
    // Take screenshot after photo capture
    await page.screenshot({ path: 'mobile-after-capture.png', fullPage: true });
    console.log('✓ Screenshot saved: mobile-after-capture.png');
    
    // Check Process Image button position
    const processButton = await page.$('.process-image-btn');
    if (processButton) {
      const processRect = await processButton.boundingBox();
      console.log('⚡ Process Image button position:', processRect);
      
      // Compare with Upload button to verify alignment
      if (uploadButton) {
        const uploadRect = await uploadButton.boundingBox();
        const alignmentDiff = Math.abs(uploadRect.x - processRect.x);
        console.log('📏 Button alignment difference:', alignmentDiff + 'px');
        if (alignmentDiff < 5) {
          console.log('✅ Buttons are properly aligned');
        } else {
          console.log('❌ Buttons are not aligned');
        }
      }
    }
    
    // Check photo preview box
    const photoBox = await page.$('.image-preview-box');
    if (photoBox) {
      const photoRect = await photoBox.boundingBox();
      console.log('🖼️ Photo preview box position:', photoRect);
    }
    
    // Check Take Another button
    const takeAnotherButton = await page.$('.take-another-btn');
    if (takeAnotherButton) {
      const takeAnotherRect = await takeAnotherButton.boundingBox();
      console.log('🔄 Take Another button position:', takeAnotherRect);
    }
    
    // Verify layout order and check for overlaps
    const elements = await page.evaluate(() => {
      const upload = document.querySelector('.upload-photo-btn');
      const process = document.querySelector('.process-image-btn');
      const photo = document.querySelector('.image-preview-box');
      const takeAnother = document.querySelector('.take-another-btn');
      
      const uploadRect = upload ? upload.getBoundingClientRect() : null;
      const processRect = process ? process.getBoundingClientRect() : null;
      const photoRect = photo ? photo.getBoundingClientRect() : null;
      const takeAnotherRect = takeAnother ? takeAnother.getBoundingClientRect() : null;
      
      return {
        upload: uploadRect,
        process: processRect,
        photo: photoRect,
        takeAnother: takeAnotherRect
      };
    });
    
    console.log('📐 Detailed element positions:');
    console.log('Upload:', elements.upload);
    console.log('Process:', elements.process);
    console.log('Photo:', elements.photo);
    console.log('Take Another:', elements.takeAnother);
    
    // Check for overlaps
    let hasOverlaps = false;
    if (elements.process && elements.photo) {
      const processBottom = elements.process.y + elements.process.height;
      const photoTop = elements.photo.y;
      if (processBottom > photoTop + 10) { // Allow 10px tolerance
        console.log('❌ OVERLAP: Process Image overlaps with Photo Preview');
        hasOverlaps = true;
      }
    }
    
    // Verify correct order
    if (elements.upload && elements.process && elements.photo && 
        elements.upload.y < elements.process.y && 
        elements.process.y + elements.process.height < elements.photo.y && 
        (!elements.takeAnother || elements.photo.y + elements.photo.height < elements.takeAnother.y)) {
      console.log('✅ Layout order is correct: Upload → Process → Photo → Take Another');
    } else {
      console.log('❌ Layout order is incorrect');
    }
    
    // Check button widths match
    if (elements.upload && elements.process) {
      const widthDiff = Math.abs(elements.upload.width - elements.process.width);
      if (widthDiff < 5) {
        console.log('✅ Button widths match');
      } else {
        console.log(`❌ Button widths don't match: Upload=${elements.upload.width}px, Process=${elements.process.width}px`);
      }
    }
    
    if (!hasOverlaps) {
      console.log('✅ No overlapping elements detected');
    }
    
    console.log('🏁 Mobile layout test completed');
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Error during mobile test:', error);
  } finally {
    await browser.close();
  }
}

testMobileLayout();