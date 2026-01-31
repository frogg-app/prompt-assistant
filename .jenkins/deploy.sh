#!/bin/bash
set -e

# Stop existing container if running
docker stop prompt-assistant-jenkins 2>/dev/null || true
docker rm prompt-assistant-jenkins 2>/dev/null || true

# Launch the app on port 5000
echo "=== Launching prompt-assistant on port 5000 ==="
docker run -d \
  --name prompt-assistant-jenkins \
  -p 5000:8080 \
  -v "$HOME/.claude:/home/app/.claude" \
  -v "$HOME/.copilot:/home/app/.copilot" \
  --restart unless-stopped \
  prompt-assistant

echo "App launched on port 5000"
