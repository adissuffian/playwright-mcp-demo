#!/usr/bin/env node

// Test one of the MCP tools to ensure Playwright integration works
import { spawn } from 'child_process';

console.log('🎭 Testing Playwright MCP Tool Integration...\n');

// Start the server
const server = spawn('node', ['build/playwright-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let messageId = 1;

function sendMessage(method, params = {}) {
  const message = {
    jsonrpc: '2.0',
    id: messageId++,
    method: method,
    params: params
  };
  server.stdin.write(JSON.stringify(message) + '\n');
  return messageId - 1;
}

// Handle server responses
let responseBuffer = '';
let initComplete = false;

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        
        if (response.id === 1 && !initComplete) {
          // Initialization complete
          console.log('✅ MCP Server initialized');
          initComplete = true;
          
          // Test the demo website tool
          console.log('🧪 Testing demo website...');
          sendMessage('tools/call', {
            name: 'testDemoWebsite',
            arguments: {}
          });
        } else if (response.id === 2 && response.result) {
          // Tool execution result
          console.log('📋 Test Results:');
          console.log(response.result.content[0].text);
          
          console.log('\n🎉 Playwright integration test successful!');
          server.kill();
          process.exit(0);
        } else if (response.error) {
          console.error('❌ Error:', response.error);
          server.kill();
          process.exit(1);
        }
      } catch (e) {
        // Ignore JSON parsing errors for partial responses
      }
    }
  }
});

// Initialize the server
sendMessage('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {
    name: 'test-client',
    version: '1.0.0'
  }
});

// Timeout after 30 seconds (Playwright needs time to launch)
setTimeout(() => {
  console.log('⏰ Timeout - stopping test');
  server.kill();
  process.exit(1);
}, 30000);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});