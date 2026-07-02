#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
LOCAL_NODE_DIR="$ROOT_DIR/.local/node-v20.20.2-darwin-arm64/bin"

if [ -x "$LOCAL_NODE_DIR/node" ]; then
  PATH="$LOCAL_NODE_DIR:$PATH"
fi

export PATH
export npm_config_cache="${npm_config_cache:-$ROOT_DIR/.npm-cache}"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"

command_name="${1:-}"

if [ -z "$command_name" ]; then
  echo "Usage: ./scripts/local-run.sh <install|dev|build|start|lint> [extra args...]" >&2
  exit 1
fi

shift

case "$command_name" in
  install)
    exec npm install "$@"
    ;;
  dev)
    export WATCHPACK_POLLING="${WATCHPACK_POLLING:-true}"
    export CHOKIDAR_USEPOLLING="${CHOKIDAR_USEPOLLING:-1}"
    exec npm run dev "$@"
    ;;
  build)
    exec npm run build "$@"
    ;;
  start)
    exec npm run start "$@"
    ;;
  lint)
    exec npm run lint "$@"
    ;;
  netlify-check)
    exec npm run netlify:check "$@"
    ;;
  *)
    echo "Unknown command: $command_name" >&2
    exit 1
    ;;
esac
