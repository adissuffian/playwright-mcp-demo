import { chromium } from 'playwright';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Configuration - set to true to see browser windows
const HEADED_MODE = process.env.PLAYWRIGHT_HEADED === 'true' || process.argv.includes('--headed');
const SLOW_MO = process.env.PLAYWRIGHT_SLOWMO ? parseInt(process.env.PLAYWRIGHT_SLOWMO) : 0;

// Browser launch options
const getBrowserOptions = () => ({
  headless: !HEADED_MODE,
  slowMo: SLOW_MO, // Slow down operations for better visibility
  devtools: HEADED_MODE, // Open devtools in headed mode
});

// Define a comprehensive MCP server for browser testing
const server = new McpServer({
  name: 'playwright-mcp-server',
  version: '1.0.0',
});

// Tool 1: Basic homepage text test
server.registerTool(
  'testHomepage',
  {
    title: 'Test Homepage',
    description: 'Checks if the homepage loads and contains expected text.',
    inputSchema: {
      url: z.string().describe('URL of the website to test'),
      expectedText: z.string().describe('Text expected to be found on the homepage'),
    },
  },
  async (args, _extra) => {
    const { url, expectedText } = args;
    const browser = await chromium.launch(getBrowserOptions());
    const page = await browser.newPage();
    
    try {
      await page.goto(url);
      const content = await page.content();
      const found = content.includes(expectedText);
      await browser.close();
      
      return {
        content: [
          {
            type: 'text',
            text: found
              ? `✅ Success: Found "${expectedText}" on ${url}`
              : `❌ Failure: "${expectedText}" not found on ${url}`,
          },
        ],
      };
    } catch (error) {
      await browser.close();
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error testing ${url}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool 2: Click element and verify result
server.registerTool(
  'clickAndVerify',
  {
    title: 'Click Element and Verify',
    description: 'Clicks an element on the page and verifies expected behavior.',
    inputSchema: {
      url: z.string().describe('URL of the website to test'),
      selector: z.string().describe('CSS selector of the element to click'),
      expectedText: z.string().describe('Text that should appear after clicking'),
    },
  },
  async (args, _extra) => {
    const { url, selector, expectedText } = args;
    const browser = await chromium.launch(getBrowserOptions());
    const page = await browser.newPage();
    
    try {
      await page.goto(url);
      await page.click(selector);
      await page.waitForTimeout(1000); // Wait for dynamic content
      const content = await page.content();
      const found = content.includes(expectedText);
      await browser.close();
      
      return {
        content: [
          {
            type: 'text',
            text: found
              ? `✅ Success: Clicked "${selector}" and found "${expectedText}"`
              : `❌ Failure: Clicked "${selector}" but "${expectedText}" not found`,
          },
        ],
      };
    } catch (error) {
      await browser.close();
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error clicking ${selector} on ${url}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool 3: Fill form and submit
server.registerTool(
  'fillForm',
  {
    title: 'Fill and Submit Form',
    description: 'Fills out a form with provided data and submits it.',
    inputSchema: {
      url: z.string().describe('URL of the website with the form'),
      formData: z.object({}).describe('JSON object with field selectors as keys and values to fill'),
      submitSelector: z.string().describe('CSS selector of the submit button'),
    },
  },
  async (args, _extra) => {
    const { url, formData, submitSelector } = args;
    const browser = await chromium.launch(getBrowserOptions());
    const page = await browser.newPage();
    
    try {
      await page.goto(url);
      
      // Fill form fields
      for (const [selector, value] of Object.entries(formData)) {
        await page.fill(selector, value as string);
      }
      
      // Submit form
      await page.click(submitSelector);
      await page.waitForTimeout(1000);
      
      await browser.close();
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Success: Filled form with ${Object.keys(formData).length} fields and submitted`,
          },
        ],
      };
    } catch (error) {
      await browser.close();
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error filling form on ${url}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool 4: Take screenshot
server.registerTool(
  'takeScreenshot',
  {
    title: 'Take Screenshot',
    description: 'Takes a screenshot of the webpage and saves it.',
    inputSchema: {
      url: z.string().describe('URL of the website to screenshot'),
      filename: z.string().optional().describe('Optional filename for the screenshot'),
    },
  },
  async (args, _extra) => {
    const { url, filename } = args;
    const browser = await chromium.launch(getBrowserOptions());
    const page = await browser.newPage();
    
    try {
      await page.goto(url);
      const screenshotName = filename || `screenshot-${Date.now()}.png`;
      await page.screenshot({ path: screenshotName, fullPage: true });
      await browser.close();
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Success: Screenshot saved as ${screenshotName}`,
          },
        ],
      };
    } catch (error) {
      await browser.close();
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error taking screenshot of ${url}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool 5: Test demo website
server.registerTool(
  'testDemoWebsite',
  {
    title: 'Test Local Demo Website',
    description: 'Runs comprehensive tests on the local demo website.',
    inputSchema: {
      headed: z.boolean().optional().describe('Run in headed mode (visible browser window)'),
    },
  },
  async (args, _extra) => {
    const { headed = false } = args;
    const browserOptions = headed ? 
      { headless: false, slowMo: 1000, devtools: true } : 
      getBrowserOptions();
    const browser = await chromium.launch(browserOptions);
    const page = await browser.newPage();
    const results = [];
    
    try {
      // Get the absolute path to the demo website
      const demoPath = 'file://' + path.resolve('./demo-website.html');
      await page.goto(demoPath);
      
      // Test 1: Check title
      const title = await page.title();
      results.push(`📄 Page title: "${title}"`);
      
      // Test 2: Check static text
      const uniqueText = await page.textContent('#unique-text');
      results.push(`🔍 Unique text found: "${uniqueText}"`);
      
      // Test 3: Click button and check dynamic content
      await page.click('#show-button');
      await page.waitForTimeout(500);
      const dynamicVisible = await page.isVisible('#dynamic-content');
      results.push(`🖱️ Button click test: ${dynamicVisible ? '✅ Dynamic content shown' : '❌ Dynamic content not shown'}`);
      
      // Test 4: Fill form
      await page.fill('#name-input', 'Test User');
      await page.selectOption('#country-select', 'us');
      results.push(`📝 Form filled with test data`);
      
      // Test 5: Check links
      const links = await page.locator('a').count();
      results.push(`🔗 Found ${links} links on the page`);
      
      await browser.close();
      
      return {
        content: [
          {
            type: 'text',
            text: `🧪 Demo Website Test Results:\n\n${results.join('\n')}`,
          },
        ],
      };
    } catch (error) {
      await browser.close();
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error testing demo website: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport);