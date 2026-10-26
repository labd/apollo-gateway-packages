# @labdigital/apollo-gateway-directives

## 0.3.0

### Minor Changes

- 89c6271: Update dependencies and require Node.js >= 22.19.
  
  - `@labdigital/apollo-trusted-documents`: `keyv` is no longer a runtime dependency. The `cache` option accepts any object with `get`/`set` (`DocumentCache`), for example a keyv 5 or keyv 6 `Keyv` instance.
  - `@labdigital/apollo-server-integration-fastify`: `@apollo/server` and `fastify` are now peer dependencies instead of being bundled into the package.
  - All packages now declare an `exports` map (ESM only, `main`/`module` removed) and `sideEffects: false`.
- a5e9bc6: Require Node.js >= 22.18 (Node 20 is end-of-life) and update dependencies to resolve security advisories.

## 0.2.0

### Minor Changes

- 737b276: Add support for applying directives on all operation types

### Patch Changes

- 737b276: Update dependencies

## 0.1.1

### Patch Changes

- dbc2fd6: Add list support

## 0.1.0

### Minor Changes

- fb0c05e: Migrate all packages to a mono-repo

## 0.0.3

### Patch Changes

- e315292: Resolve issue in package.json (missing `main`)

## 0.0.2

### Patch Changes

- 984a1f0: Fix release where index.js was not defined

## 0.0.1

### Patch Changes

- 85e7d8b: Initial version
