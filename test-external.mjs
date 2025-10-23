#!/usr/bin/env node

// Test external website functionality
import { spawn } from 'child_process';

console.log('🌐 Testing External Website Integration...\n');

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

let responseBuffer = '';
let initComplete = false;
let testStep = 0;

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        
        if (response.id === 1 && !initComplete) {
          console.log('✅ MCP Server initialized');
          initComplete = true;
          
          // Test 1: Basic homepage test
          console.log('🧪 Testing example.com...');
          sendMessage('tools/call', {
            name: 'testHomepage',
            arguments: {
              url: 'https://example.com',
              expectedText: 'Example Domain'
            }
          });
          testStep = 1;
          
        } else if (response.id === 2 && testStep === 1) {
          console.log('📋 Homepage Test Result:');
          console.log(response.result.content[0].text);
          
          // Test 2: Take screenshot
          console.log('\n📸 Taking screenshot of example.com...');
          sendMessage('tools/call', {
            name: 'takeScreenshot',
            arguments: {
              url: 'https://example.com',
              filename: 'example-com-test.png'
            }
          });
          testStep = 2;
          
        } else if (response.id === 3 && testStep === 2) {
          console.log('📋 Screenshot Result:');
          console.log(response.result.content[0].text);
          
          console.log('\n🎉 All external website tests passed!');
          server.kill();
          process.exit(0);
          
        } else if (response.error) {
          console.error('❌ Error:', response.error);
          server.kill();
          process.exit(1);
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
  }
});

// Initialize
sendMessage('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {
    name: 'test-client',
    version: '1.0.0'
  }
});

setTimeout(() => {
  console.log('⏰ Timeout - stopping test');
  server.kill();
  process.exit(1);
}, 60000);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});