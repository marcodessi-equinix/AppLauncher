#!/bin/sh
set -eu

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

API_URL_VALUE=$(json_escape "${API_URL:-/api}")
BUILD_VERSION_VALUE=$(json_escape "${BUILD_VERSION:-unknown}")
BUILD_DATE_VALUE=$(json_escape "${BUILD_DATE:-unknown}")
GIT_SHA_VALUE=$(json_escape "${GIT_SHA:-unknown}")

cat > /app/dist/runtime-config.js <<EOF
window.RUNTIME_CONFIG = {
  API_URL: "$API_URL_VALUE",
  BUILD_VERSION: "$BUILD_VERSION_VALUE",
  BUILD_DATE: "$BUILD_DATE_VALUE",
  GIT_SHA: "$GIT_SHA_VALUE"
};
EOF

exec "$@"