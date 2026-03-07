#!/bin/sh
set -eu

# Ensure mounted volumes are writable, then drop privileges.
mkdir -p /app/data /app/uploads/icons
chown -R node:node /app/data /app/uploads

exec su-exec node "$@"
