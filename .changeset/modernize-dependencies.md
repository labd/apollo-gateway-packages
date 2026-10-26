---
"@labdigital/apollo-gateway-directives": minor
"@labdigital/apollo-server-integration-fastify": minor
"@labdigital/apollo-trusted-documents": minor
---

Update dependencies and require Node.js >= 22.19.

- `@labdigital/apollo-trusted-documents`: the `cache` option now expects a keyv 6 `Keyv` instance.
- `@labdigital/apollo-server-integration-fastify`: `@apollo/server` and `fastify` are now peer dependencies instead of being bundled into the package.
