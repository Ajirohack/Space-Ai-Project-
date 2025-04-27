#!/bin/bash

# Inject our sidebar scripts into OpenWebUI
echo "Injecting Diego GPT sidebar..."
cd /app

# Create necessary directories
mkdir -p /app/extension/icons

# Create dummy icons if they don't exist
if [ ! -f /app/extension/icons/icon16.png ]; then
  convert -size 16x16 xc:transparent /app/extension/icons/icon16.png
fi
if [ ! -f /app/extension/icons/icon48.png ]; then
  convert -size 48x48 xc:transparent /app/extension/icons/icon48.png
fi
if [ ! -f /app/extension/icons/icon128.png ]; then
  convert -size 128x128 xc:transparent /app/extension/icons/icon128.png
fi

# Include our sidebar injection script in the Open WebUI HTML
INDEX_FILE="/app/frontend/dist/index.html"
if [ -f "$INDEX_FILE" ]; then
  # Add our script to the head
  sed -i 's/<\/head>/<script src="\/inject-sidebar.js"><\/script><\/head>/' "$INDEX_FILE"
  echo "Sidebar script injected into index.html"
else
  echo "Warning: Could not find index.html to inject sidebar script"
fi

# Start the original entrypoint
echo "Starting Open WebUI..."
exec /app/entrypoint.sh
