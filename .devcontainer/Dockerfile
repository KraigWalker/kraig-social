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

USER node

RUN mkdir -p /home/node/.npm /home/node/.pnpm-store /home/node/.rush
