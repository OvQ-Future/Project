#!/bin/sh
set -e

DATA_PATH="${DATA_DIR:-/app/data}"
mkdir -p "$DATA_PATH"

if [ "$(id -u)" = "0" ]; then
  chown -R node:node "$DATA_PATH"
  exec su-exec node:node "$@"
fi

exec "$@"
