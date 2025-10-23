#!/usr/bin/env node

import { chromium } from 'playwright';
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import * as path from 'path';

// Demo script that shows how to use the Playwright MCP server programmatically
async function runDemo() {
  console.log('🚀 Starting Playwright MCP Demo...\n');

  // Start the MCP server process
  const serverProcess = spawn('node', ['build/playwright-mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Create MCP client
  const transport = new StdioClientTransport({
    reader: serverProcess.stdout,
    writer: serverProcess.stdin
  });

  const client = new McpClient({
    name: 'playwright-demo-client',
    version: '1.0.0'
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // List available tools
    const tools = await client.listTools();
    console.log('\n📋 Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Test 1: Test demo website
    console.log('\n🧪 Running comprehensive demo website test...');
    const demoResult = await client.callTool('testDemoWebsite', {});
    console.log(demoResult.content[0].text);

    // Test 2: Test a real website (example.com)
    console.log('\n🌐 Testing example.com...');
    const homepageResult = await client.callTool('testHomepage', {
      url: 'https://example.com',
      expectedText: 'Example Domain'
    });
    console.log(homepageResult.content[0].text);

    // Test 3: Take a screenshot
    console.log('\n📸 Taking screenshot of example.com...');
    const screenshotResult = await client.callTool('takeScreenshot', {
      url: 'https://example.com',
      filename: 'example-com-demo.png'
    });
    console.log(screenshotResult.content[0].text);

    console.log('\n✨ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Clean up
    serverProcess.kill();
    await client.close();
  }
}

// Run the demo
runDemo().catch(console.error);