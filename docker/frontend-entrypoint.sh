#!/bin/sh
set -eu

RUNTIME_CONFIG_FILE="/usr/share/nginx/html/runtime-config.js"

cat > "$RUNTIME_CONFIG_FILE" <<'EOF'
window.RUNTIME_CONFIG = {
  API_URL: window.location.origin.replace(/\/$/, '') + '/api'
};
EOF
