FROM node:24.16.0-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        git \
        procps \
        sudo \
    && rm -rf /var/lib/apt/lists/*

RUN echo "node ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -eu' \
    'dir="$PWD"' \
    'while [ "$dir" != "/" ]; do' \
    '  script="$dir/common/scripts/install-run-rush.js"' \
    '  if [ -f "$script" ]; then' \
    '    exec node "$script" "$@"' \
    '  fi' \
    '  dir="$(dirname "$dir")"' \
    'done' \
    'echo "Unable to find common/scripts/install-run-rush.js above $PWD" >&2' \
    'exit 1' \
    > /usr/local/bin/rush \
    && printf '%s\n' \
    '#!/bin/sh' \
    'set -eu' \
    'dir="$PWD"' \
    'while [ "$dir" != "/" ]; do' \
    '  script="$dir/common/scripts/install-run-rushx.js"' \
    '  if [ -f "$script" ]; then' \
    '    exec node "$script" "$@"' \
    '  fi' \
    '  dir="$(dirname "$dir")"' \
    'done' \
    'echo "Unable to find common/scripts/install-run-rushx.js above $PWD" >&2' \
    'exit 1' \
    > /usr/local/bin/rushx \
    && printf '%s\n' \
    '#!/bin/sh' \
    'set -eu' \
    'dir="$PWD"' \
    'while [ "$dir" != "/" ]; do' \
    '  script="$dir/common/scripts/install-run-rush-pnpm.js"' \
    '  if [ -f "$script" ]; then' \
    '    exec node "$script" "$@"' \
    '  fi' \
    '  dir="$(dirname "$dir")"' \
    'done' \
    'echo "Unable to find common/scripts/install-run-rush-pnpm.js above $PWD" >&2' \
    'exit 1' \
    > /usr/local/bin/rush-pnpm \
    && chmod +x /usr/local/bin/rush /usr/local/bin/rushx /usr/local/bin/rush-pnpm

USER node

RUN mkdir -p /home/node/.npm /home/node/.pnpm-store /home/node/.rush
