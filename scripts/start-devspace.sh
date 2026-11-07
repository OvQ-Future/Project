#!/usr/bin/env bash
set -e
systemctl start docker
for i in $(seq 1 30); do
  if docker info >/dev/null 2>&1; then break; fi
  sleep 1
done
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
docker compose up -d
