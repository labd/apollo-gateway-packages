# @labdigital/apollo-server-integration-fastify

## 0.2.0

### Minor Changes

- 89c6271: Update dependencies and require Node.js >= 22.19.
  
  - `@labdigital/apollo-trusted-documents`: `keyv` is no longer a runtime dependency. The `cache` option accepts any object with `get`/`set` (`DocumentCache`), for example a keyv 5 or keyv 6 `Keyv` instance.
  - `@labdigital/apollo-server-integration-fastify`: `@apollo/server` and `fastify` are now peer dependencies instead of being bundled into the package.
  - All packages now declare an `exports` map (ESM only, `main`/`module` removed) and `sideEffects: false`.
- a5e9bc6: Require Node.js >= 22.18 (Node 20 is end-of-life) and update dependencies to resolve security advisories.

## 0.1.1

### Patch Changes

- 737b276: Update dependencies

## 0.1.0

### Minor Changes

- fb0c05e: Migrate all packages to a mono-repo

## 0.0.2

### Patch Changes

- 68e5212: Correctly export types from library

## 0.0.1

### Patch Changes

- e6891f0: Initial version
