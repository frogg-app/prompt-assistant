# Prompt Improver

A web app that turns rough, user-written prompts into polished prompts for specific LLM providers. Optional Learning Mode provides detailed feedback with scores out of 10 for each category plus a total score.

## Features

- **Frontend-only API calls**: OpenAI and Gemini work directly from your browser - no backend needed!
- Your API keys are stored locally in your browser and never sent to any server
- Prompt improvement with clarifications workflow when needed
- Optional Learning Mode with category scores (0-10), total score, and actionable coaching
- Clean, modern chat-style interface

## Quick Start (Frontend-Only)

The simplest way to use Prompt Assistant is frontend-only mode with OpenAI or Gemini:

1. Open the app in your browser
2. Click "Manage Providers" in the options panel  
3. Enter your OpenAI or Gemini API key
4. Start improving prompts!

No backend server required - all API calls happen directly from your browser.

## Architecture

### Frontend-Only Mode (Default)
- **OpenAI**: Direct browser-to-API calls using your personal API key
- **Gemini**: Direct browser-to-API calls using your personal API key
- API keys stored in browser localStorage (never transmitted to any server)

### Backend Mode (Optional, for CLI tools)
- **Copilot CLI**: Requires backend server with `copilot` binary installed
- **Claude Code**: Requires backend server with `claude` binary installed

See [CLI_TOOLING_PLAN.md](./CLI_TOOLING_PLAN.md) for the roadmap on multi-user CLI tool support.

## Development Setup

### Frontend-Only Development

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:32100 and add your API keys in the settings.

### Full Development (with Backend)

If you need CLI-based providers (Copilot, Claude Code):

1. Backend (API on port 8080):
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Frontend (Vite dev server on port 32100):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Provider Setup

### OpenAI (Frontend-Only)

1. Get an API key from https://platform.openai.com/api-keys
2. Click "Manage Providers" in the app
3. Enter your API key for OpenAI
4. Your key is stored locally and API calls go directly to OpenAI

### Gemini (Frontend-Only)

1. Get an API key from https://ai.google.dev/gemini-api/docs/api-key
2. Click "Manage Providers" in the app
3. Enter your API key for Gemini
4. Your key is stored locally and API calls go directly to Google

### Copilot CLI (Requires Backend)

1. Install Copilot CLI and authenticate
2. Run the backend server
3. Set `GH_TOKEN` or `GITHUB_TOKEN` environment variable

### Claude Code (Requires Backend)

1. Install Claude Code and run `/login`
2. Run the backend server
3. Mount auth files if using Docker

## Security

- **API keys are never sent to any server** - they're stored in your browser's localStorage
- All API calls for OpenAI/Gemini go directly from your browser to the provider
- Keys are lightly obfuscated in storage to prevent casual viewing
- For CLI-based providers, credentials stay on your backend server

## Docker Deployment

For self-hosting with CLI provider support:

```bash
docker build -t prompt-assistant .
docker run --rm -p 8080:8080 --env-file .env prompt-assistant
```

For frontend-only use, you can serve the static files from any web server.

## Static Deployment (Frontend-Only)

Build the frontend and deploy to any static hosting:

```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting provider
```

Works with GitHub Pages, Netlify, Vercel, S3, etc.

## CLI Tooling Roadmap

See [CLI_TOOLING_PLAN.md](./CLI_TOOLING_PLAN.md) for the plan to support:
- Self-hosted backend mode for CLI tools
- Local agent architecture for multi-user CLI tool access

## License

TBD
