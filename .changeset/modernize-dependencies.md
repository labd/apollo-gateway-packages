---
"@labdigital/apollo-gateway-directives": minor
"@labdigital/apollo-server-integration-fastify": minor
"@labdigital/apollo-trusted-documents": minor
---

Update dependencies and require Node.js >= 22.19.

- `@labdigital/apollo-trusted-documents`: `keyv` is no longer a runtime dependency. The `cache` option accepts any object with `get`/`set` (`DocumentCache`), for example a keyv 5 or keyv 6 `Keyv` instance.
- `@labdigital/apollo-server-integration-fastify`: `@apollo/server` and `fastify` are now peer dependencies instead of being bundled into the package.
- All packages now declare an `exports` map (ESM only, `main`/`module` removed) and `sideEffects: false`.
