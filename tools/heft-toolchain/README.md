# @kraigwalker/heft-toolchain

Shared command runner and tool dependency package for Kraig Social Heft rigs.

## What This Package Owns

- OXC formatting and linting binaries.
- Vite and Vitest binaries used by the Heft rigs.
- React Router dev/build/typegen helper invocation.
- `tsgo` concurrency policy for builds and typechecks.

Buildable projects should depend on the appropriate rig and this toolchain package, not on every
tool binary directly. For example, app projects should not add direct `vite` or `vitest`
dependencies merely to run `rushx build` or `rushx test`.

## Script Entrypoints

- `scripts/heft-task.cjs` is called by Heft run-script tasks.
- `scripts/react-router-dev.cjs` starts React Router dev mode for app projects.

The Heft task runner supports these tool names:

- `react-router-build`
- `react-router-typegen`
- `vite-build`
- `vitest`
- `tsgo-build`
- `tsgo-check`
- `tsgo-declarations`
- `oxlint`
- `oxlint-fix`
- `oxfmt-check`
- `oxfmt-write`

## Maintainer Notes

- Prefer resolving build/test binaries from this package so versions stay consistent across the
  monorepo.
- Project-local dependencies are still appropriate for libraries imported by source or test files,
  such as `@testing-library/react`.
- Keep tool upgrades coordinated with the rigs and run a targeted Rush build after changes.
- `KRAIG_LOW_MEMORY=1` or `CI=true` forces `tsgo` into single-threaded mode.
