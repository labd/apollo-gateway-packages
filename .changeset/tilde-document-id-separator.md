---
"@labdigital/apollo-trusted-documents": minor
---

Support tilde-separated persisted document ids (`appName~appVersion~documentId`), the format used by Hive Router and the Hive CDN. See the [Hive app deployments docs](https://the-guild.dev/graphql/hive/docs/schema-registry/app-deployments#sending-persisted-document-requests-from-your-app).

The previous slash-separated format (`appName/appVersion/documentId`) is now **deprecated** but still accepted as a fallback. Migrate clients to the tilde separator; support for the slash format may be removed in a future major release.
