const puppeteer = require('puppeteer');

describe('Spare Queen App', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  afterAll(() => {
    browser.close();
  });

  it('should display the login page', async () => {
    await page.waitForSelector('h2');
    const header = await page.$eval('h2', (e) => e.textContent);
    expect(header).toEqual('Login');
  });

  it('should allow the user to login', async () => {
    await page.type('input[placeholder="Username"]', 'Mary');
    await page.type('input[placeholder="Password"]', 'SpareQueen!');
    await page.click('button');
    await page.waitForSelector('nav');
    const navExists = await page.$('nav');
    expect(navExists).not.toBeNull();
  });
});