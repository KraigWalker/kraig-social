# Dispatch Panel Remote

Vite-built Module Federation remote consumed by the Kraig Social React Router host.

- `rushx build` emits browser and Node SSR artifacts for releases `1.0.0` and `1.1.0`.
- `rushx dev` runs the current `1.1.0` browser remote on port `3002`.
- `./DispatchPanel` is the primary React contract.
- `./mount` is the compatibility mount/unmount contract.

The gateway serves built release artifacts from `/mf/releases/:version/:target/*`.
