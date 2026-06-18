# Dev Container Image

This Rush project owns the build-time definition for the repository's
development container. GitHub Actions builds `devcontainer.json`, applies its
Dev Container Features, and publishes the result to GitHub Container Registry.

The developer-facing configuration in `.devcontainer/devcontainer.json`
references the resulting pre-built image and owns workspace-specific settings
such as mounts, ports, editor extensions, and the post-create command.

Build locally:

```bash
npx --yes @devcontainers/cli build \
  --workspace-folder ../.. \
  --config devcontainer.json
```

The command above is intended to be run from this directory.
