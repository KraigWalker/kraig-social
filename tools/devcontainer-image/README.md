# Dev Container Image

This Rush project owns the complete reusable definition for the repository's
development container. GitHub Actions builds `devcontainer.json`, applies its
Dev Container Features, embeds supported runtime settings as image metadata,
and publishes the result to GitHub Container Registry.

The developer-facing configuration in `.devcontainer/devcontainer.json` only
references the resulting pre-built image. Dev Container clients merge the
image metadata into that local configuration when creating the container.

Build locally:

```bash
npx --yes @devcontainers/cli build \
  --workspace-folder ../.. \
  --config devcontainer.json
```

The command above is intended to be run from this directory.
