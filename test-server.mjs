#!/usr/bin/env node

// Simple test to verify the MCP server starts and responds
import { spawn } from 'child_process';

console.log('🧪 Testing Playwright MCP Server...\n');

// Start the server
const server = spawn('node', ['build/playwright-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Send initialization message
const initMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

server.stdin.write(JSON.stringify(initMessage) + '\n');

// Handle server response
let responseBuffer = '';
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Check if we have a complete JSON response
  const lines = responseBuffer.split('\n');
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        if (response.id === 1 && response.result) {
          console.log('✅ MCP Server started successfully!');
          console.log('📋 Server capabilities:', JSON.stringify(response.result.capabilities, null, 2));
          
          // Test tools listing
          const toolsMessage = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list'
          };
          server.stdin.write(JSON.stringify(toolsMessage) + '\n');
        } else if (response.id === 2 && response.result) {
          console.log('\n🔧 Available tools:');
          response.result.tools.forEach((tool, index) => {
            console.log(`  ${index + 1}. ${tool.name}: ${tool.description}`);
          });
          
          console.log('\n🎉 All tests passed! MCP server is ready for use.');
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        // Ignore JSON parsing errors for partial responses
      }
    }
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Timeout - stopping test');
  server.kill();
  process.exit(1);
}, 10000);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});