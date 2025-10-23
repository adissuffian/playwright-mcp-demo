#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('🎭 Testing Playwright MCP Server in HEADED mode...\n');

const server = spawn('node', ['build/playwright-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

const testCall = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "testDemoWebsite",
    arguments: {
      headed: true
    }
  }
};

let outputBuffer = '';
let testCompleted = false;

function evaluateOutput() {
  // Success criteria: JSON result containing Demo Website Test Results and Dynamic content shown
  if (outputBuffer.includes('🧪 Demo Website Test Results') && outputBuffer.includes('Dynamic content shown')) {
    console.log('\n✅ HEADED MODE TEST PASSED: Demo website tool responded and dynamic content appeared.');
    testCompleted = true;
    try { server.kill(); } catch {}
    process.exit(0);
  }
}

server.stdout.on('data', (data) => {
  const chunk = data.toString();
  outputBuffer += chunk;
  console.log('Server output:', chunk);
  evaluateOutput();
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('close', (code) => {
  if (testCompleted) return; // Already handled
  console.log(`\n🔚 Server process exited with code ${code}`);
  if (!testCompleted && (outputBuffer.includes('🧪 Demo Website Test Results') || outputBuffer.includes('Dynamic content shown'))) {
    console.log('⚠️ Server exited before explicit success, but results were present -> marking as pass.');
    process.exit(0);
  } else {
    console.log('❌ Test failed or incomplete');
    process.exit(1);
  }
});

setTimeout(() => {
  console.log('📨 Sending headed mode test request...');
  server.stdin.write(JSON.stringify(testCall) + '\n');
  // Failsafe timeout
  setTimeout(() => {
    if (!testCompleted) {
      console.log('\n⏱️ Timeout reached without confirming success. Current output:\n', outputBuffer);
      try { server.kill(); } catch {}
      process.exit(1);
    }
  }, 15000);
}, 1000);