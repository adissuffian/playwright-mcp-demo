# Playwright MCP Test Project

This project demonstrates how to use Playwright with Model Context Protocol (MCP) to test websites and expose browser automation as MCP tools.

## Features
- 🎭 **Playwright-powered browser automation** - Comprehensive web testing capabilities
- 🔧 **5 MCP Tools** for different testing scenarios:
  - `testHomepage` - Basic text presence testing
  - `clickAndVerify` - Interactive element testing
  - `fillForm` - Form automation and submission
  - `takeScreenshot` - Visual documentation
  - `testDemoWebsite` - Comprehensive local demo testing
- 🌐 **Demo website included** - Ready-to-test HTML page with various elements
- 📋 **MCP Server** exposing all tools via standardized protocol

## Available MCP Tools

### 1. `testHomepage`
Checks if a webpage loads and contains expected text.
```json
{
  "url": "https://example.com",
  "expectedText": "Example Domain"
}
```

### 2. `clickAndVerify`
Clicks an element and verifies expected behavior.
```json
{
  "url": "file://./demo-website.html",
  "selector": "#show-button",
  "expectedText": "This content appeared after clicking"
}
```

### 3. `fillForm`
Fills out and submits forms.
```json
{
  "url": "file://./demo-website.html",
  "formData": {
    "#name-input": "Test User",
    "#country-select": "us"
  },
  "submitSelector": "button[type=submit]"
}
```

### 4. `takeScreenshot`
Captures webpage screenshots.
```json
{
  "url": "https://example.com",
  "filename": "my-screenshot.png"
}
```

### 5. `testDemoWebsite`
Runs comprehensive tests on the included demo website.
```json
{}
```

## Quick Setup

### Prerequisites
- Node.js 17+
- npm

### Installation
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Running the MCP Server
```bash
# Start the MCP server (stdio mode)
node build/playwright-mcp-server.js
```

## Testing the Demo Website

The project includes a demo HTML page (`demo-website.html`) with:
- Static text content
- Interactive buttons
- Form elements
- Navigation links
- Dynamic content areas

### Quick Test
1. Open `demo-website.html` in your browser to see the test site
2. Use the `testDemoWebsite` MCP tool to run automated tests on it

## MCP Client Integration

### VS Code MCP Extension
Add to `.vscode/mcp.json`:
```json
{
  "servers": {
    "playwright-mcp-server": {
      "type": "stdio", 
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/YOUR/PROJECT/build/playwright-mcp-server.js"]
    }
  }
}
```

### Claude Desktop
Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "playwright-mcp-server": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/YOUR/PROJECT/build/playwright-mcp-server.js"]
    }
  }
}
```

## Example Usage

Once connected to an MCP client, you can:

1. **Test any website:**
   - "Test if https://example.com contains 'Example Domain'"
   - Uses `testHomepage` tool

2. **Interact with pages:**
   - "Click the show button on the demo site and verify dynamic content appears"
   - Uses `clickAndVerify` tool

3. **Automate forms:**
   - "Fill out the demo form with name 'John' and country 'US'"
   - Uses `fillForm` tool

4. **Document visually:**
   - "Take a screenshot of the demo website"
   - Uses `takeScreenshot` tool

5. **Run comprehensive tests:**
   - "Test the demo website"
   - Uses `testDemoWebsite` tool

## Project Structure

```
├── README.md                    # This file
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── playwright-mcp-server.ts    # Main MCP server implementation
├── demo-website.html           # Demo HTML page for testing
├── demo-runner.ts              # Example programmatic usage (WIP)
├── build/                      # Compiled JavaScript output
│   └── playwright-mcp-server.js
└── .vscode/
    └── mcp.json               # VS Code MCP configuration example
```

## References
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Playwright Documentation](https://playwright.dev/)

---
⚠️ **Note:** Replace `/ABSOLUTE/PATH/TO/YOUR/PROJECT/` with your actual project path in MCP configurations.