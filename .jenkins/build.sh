#!/bin/bash
set -e

echo "=== Building prompt-assistant ==="

# Build Docker image (multi-stage build)
docker build -t prompt-assistant .

# Configure git

echo "Build completed successfully!"
