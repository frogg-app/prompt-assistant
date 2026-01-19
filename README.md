# Prompt Improver

A self-hostable web app that turns rough, user-written prompts into polished prompts for specific LLM providers. Optional learning mode provides a compact critique and grading report in the same model call.

## Features

- Prompt improvement for OpenAI, Google Gemini, Copilot CLI, and Claude Code.
- Clarifications workflow when the model cannot proceed reliably.
- Optional Learning mode with grades, category scores, and actionable coaching.
- Single backend request per improvement (second request only after clarifications).
- One-container deployment: backend serves the built frontend.

## Architecture overview

- Frontend: Vite + React app in `/frontend`.
- Backend: Express API in `/backend` with provider adapters and prompt system rules.
- Providers: OpenAI + Gemini via HTTP API, Copilot CLI + Claude Code via local CLI adapters.

## Setup

### Local development

1. Backend (API on port 8080, binds to 0.0.0.0):
   ```bash
   cd backend
   npm install
   HOST=0.0.0.0 npm run dev
   ```

2. Frontend (Vite dev server on port 32100, binds to 0.0.0.0):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend dev server proxies `/providers`, `/models`, and `/improve` to `VITE_BACKEND_URL` (defaults to `http://127.0.0.1:8080`).
If you run the backend on port 32101, set `VITE_BACKEND_URL=http://127.0.0.1:32101`.

If you want to use Copilot CLI or Claude Code in local dev, install those CLIs on your machine and authenticate first.

CLI install quickstart:

```bash
curl -fsSL https://gh.io/copilot-install | bash
curl -fsSL https://claude.ai/install.sh | bash
```

Then run `copilot` or `claude` once and use `/login` to authenticate.

### Docker build/run

```bash
docker build -t prompt-assistant .

docker run --rm -p 8080:8080 --env-file .env prompt-assistant
```

To persist Copilot/Claude CLI auth in Docker, mount their config files:

```bash
docker run --rm -p 8080:8080 --env-file .env \
  -v "$HOME/.copilot:/home/app/.copilot" \
  -v "$HOME/.claude:/home/app/.claude" \
  -v "$HOME/.claude.json:/home/app/.claude.json" \
  prompt-assistant
```

If you prefer OAuth login in-container, run `docker exec -it prompt-assistant copilot` (or `claude`) and follow `/login`.

### Docker Compose

```bash
docker compose up -d --build
```

## Environment variables

Copy `.env.example` to `.env` and fill in what you need:

- `OPENAI_API_KEY`: enables OpenAI model list + prompt improvement.
- `GEMINI_API_KEY`: enables Gemini model list + prompt improvement.
- `GH_TOKEN` or `GITHUB_TOKEN`: Copilot CLI auth token with the **Copilot Requests** permission.
- `COPILOT_WORKDIR`: optional working directory for Copilot CLI (default: `/tmp`).
- `HOST`: server bind address (default `0.0.0.0`).
- `PORT`: server port (default 8080).

You can set env vars locally via `.env`, or pass them to Docker with `--env-file .env` or `-e OPENAI_API_KEY=...`.

## Provider setup (quick guide)

### OpenAI

1. Create an API key: https://platform.openai.com/api-keys  
2. Set `OPENAI_API_KEY` in `.env` or your runtime environment.

### Gemini

1. Create an API key: https://ai.google.dev/gemini-api/docs/api-key  
2. Set `GEMINI_API_KEY` in `.env` or your runtime environment.

### Copilot CLI

1. Install Copilot CLI: https://docs.github.com/copilot/concepts/agents/about-copilot-cli  
2. Authenticate with `/login`, or create a PAT with **Copilot Requests** permission.  
3. Set `GH_TOKEN` or `GITHUB_TOKEN` (recommended for headless/server use).  
4. If using Docker, mount your Copilot config when needed: `-v "$HOME/.config/github-copilot:/home/app/.config/github-copilot"`.

### Claude Code

1. Install Claude Code: https://code.claude.com/docs/en/setup  
2. Run `claude` and use `/login`.  
3. If using Docker, mount auth files: `-v "$HOME/.claude:/home/app/.claude" -v "$HOME/.claude.json:/home/app/.claude.json"`.

## Provider notes

- OpenAI: uses `/v1/models` to fetch available GPT and o1 models.
- Gemini: uses the Generative Language API to list `generateContent` models.
- Copilot CLI: uses the `copilot` binary in programmatic mode (`-p`), requires OAuth login or PAT.
- Claude Code: uses the `claude` binary with `--output-format json` and a JSON schema for strict output. Claude Code uses a separate billing plan and OAuth login (not Anthropic API keys).

## Security notes

- Do not commit real API keys. Use `.env` and `.env.example`.
- The backend does not log prompt content or API keys.
- Treat the improved prompts and learning reports as potentially sensitive.
- Copilot CLI and Claude Code use OAuth or PATs; SSH keys are not required unless you enable git operations.

## API endpoints

- `GET /health` -> `{ ok: true }`
- `GET /providers`
- `GET /models?provider=openai|gemini|copilot|claude`
- `POST /improve`

`POST /improve` payload:

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "rough_prompt": "Write a plan for a new product",
  "constraints": "",
  "learning_mode": false,
  "clarifications": null
}
```

## Troubleshooting

- **Docker build fails with missing lockfile**: ensure `backend/package-lock.json` and `frontend/package-lock.json` exist. Regenerate with `npm install --package-lock-only` in each folder.
- **Model list shows fallback**: confirm API keys are set in `.env` and passed to Docker with `--env-file .env`.
- **Copilot CLI auth error**: run `copilot` in the container and use `/login`, or set `GH_TOKEN`/`GITHUB_TOKEN`.
- **Claude Code auth error**: run `claude` in the container and use `/login`, and ensure `~/.claude` is mounted if you want to persist sessions.
- **Frontend cannot reach backend in dev**: ensure backend is running on the port in `VITE_BACKEND_URL` (default `http://127.0.0.1:8080`).
- **`/improve` returns 400**: check that `provider`, `model`, and `rough_prompt` are non-empty.

## License

TBD
