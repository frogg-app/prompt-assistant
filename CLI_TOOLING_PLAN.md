# CLI-Based Tooling Plan

This document outlines the plan for supporting CLI-based tools (Copilot CLI, Claude Code) in a multi-user environment, following the migration of API-based providers (OpenAI, Gemini) to frontend-only API calls.

## Current Architecture

### Frontend-Only Providers (Implemented)
- **OpenAI**: Users enter their API keys in the browser, which are stored locally in localStorage. API calls are made directly from the browser to OpenAI's API.
- **Gemini**: Same approach as OpenAI - browser-based API calls with locally-stored keys.

### CLI-Based Providers (Requires Backend)
- **Copilot CLI**: Requires the `copilot` binary installed on the server with OAuth or PAT authentication.
- **Claude Code**: Requires the `claude` binary with OAuth login.

## Why CLI Tools Need a Backend

1. **Binary Execution**: CLI tools are executables that must run on a server or local machine, not in a browser.
2. **Authentication State**: OAuth sessions and config files (e.g., `~/.copilot`, `~/.claude.json`) are stored on the filesystem.
3. **Security**: CLI credentials should not be exposed to the browser.

## Proposed Multi-User Architecture for CLI Tools

### Option 1: Self-Hosted Backend with CLI Support

For single-user or small team deployments:

```
┌─────────────────┐      ┌─────────────────┐
│   Web Browser   │ ───► │  Backend Server │
│   (Frontend)    │      │  (Node.js)      │
└─────────────────┘      └────────┬────────┘
                                  │
                         ┌────────┴────────┐
                         │  CLI Tools      │
                         │  - copilot      │
                         │  - claude       │
                         └─────────────────┘
```

**Pros:**
- Simple deployment
- Full CLI access
- User controls their own instance

**Cons:**
- Each user needs their own backend
- More complex setup for non-technical users

### Option 2: Agent-Based Architecture

For multi-user deployments where CLI tools run on user machines:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Web Browser   │ ───► │  Relay Server   │ ◄─── │  Local Agent    │
│   (Frontend)    │      │  (WebSocket)    │      │  (User Machine) │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                           │
                                                  ┌────────┴────────┐
                                                  │  CLI Tools      │
                                                  │  - copilot      │
                                                  │  - claude       │
                                                  └─────────────────┘
```

**Components:**
1. **Relay Server**: Lightweight WebSocket server that routes requests between browsers and agents.
2. **Local Agent**: Small daemon running on user's machine that:
   - Connects to relay server via WebSocket
   - Authenticates with unique token
   - Executes CLI commands locally
   - Returns results to browser

**Agent Implementation:**
```javascript
// Example agent structure
const agent = {
  connect: (relayUrl, userToken) => { /* WebSocket connection */ },
  executeCommand: async (command, args) => {
    // Execute copilot/claude commands
    return spawn(command, args);
  },
  sendResult: (requestId, result) => { /* Send back via WebSocket */ }
};
```

**Pros:**
- CLI tools use user's own auth
- No need to share credentials
- Scales to multiple users

**Cons:**
- Requires installing local agent
- More complex architecture
- Relay server infrastructure

### Option 3: GitHub App / OAuth Flow

For Copilot CLI specifically, leverage GitHub OAuth:

1. User authenticates via GitHub OAuth in browser
2. Backend receives GitHub token
3. Backend uses token for Copilot API calls (if API becomes available)

**Note:** This depends on GitHub exposing a proper API for Copilot that doesn't require the CLI.

## Recommended Implementation Path

### Phase 1: Document Current Limitations (Done)
- [x] Clearly indicate which providers work frontend-only
- [x] Explain that CLI providers require backend support

### Phase 2: Backend Mode Toggle
Add a configuration option to switch between:
- **Frontend-only mode**: Only OpenAI and Gemini available
- **Full mode**: Requires backend with CLI tools installed

```javascript
// Config example
{
  "mode": "frontend-only", // or "full"
  "backend_url": "http://localhost:8080" // only needed for "full" mode
}
```

### Phase 3: Local Agent (Future)
Develop a lightweight agent that users can install:

1. **Distribution**: 
   - npm package: `npm install -g prompt-assistant-agent`
   - Standalone binaries for Windows/Mac/Linux

2. **Features**:
   - Auto-discover installed CLI tools
   - Connect to browser via local WebSocket
   - Secure pairing with browser session

3. **Implementation**:
   ```bash
   # User installs agent
   npm install -g prompt-assistant-agent
   
   # Agent starts and shows pairing code
   prompt-assistant-agent start
   # Output: "Agent running. Pairing code: ABC123"
   
   # User enters code in browser to connect
   ```

## Security Considerations

1. **API Keys**: Already handled - stored in localStorage, never transmitted to any server.
2. **CLI Auth**: Agent runs locally with user's own CLI authentication.
3. **Relay Communication**: Use WSS (WebSocket Secure) with end-to-end encryption.
4. **Agent Pairing**: One-time pairing codes prevent unauthorized access.

## Timeline Estimate

| Phase | Description | Estimate |
|-------|-------------|----------|
| Phase 1 | Documentation and UI updates | Done |
| Phase 2 | Backend mode toggle | 1-2 days |
| Phase 3 | Local agent development | 2-3 weeks |

## Conclusion

The frontend-only approach works well for API-based providers (OpenAI, Gemini) where users can safely store and use their own API keys. For CLI-based tools, the recommended path is:

1. **Short-term**: Self-hosted backend for users who need CLI tools
2. **Long-term**: Local agent that connects user's CLI tools to the browser

This maintains the security principle that users manage their own credentials while enabling the full feature set of the application.
