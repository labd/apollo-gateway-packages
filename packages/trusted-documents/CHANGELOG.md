# @labdigital/apollo-trusted-documents

## 0.2.0

### Minor Changes

- 553df26: Support tilde-separated persisted document ids (`appName~appVersion~documentId`), the format used by Hive Router and the Hive CDN. See the [Hive app deployments docs](https://the-guild.dev/graphql/hive/docs/schema-registry/app-deployments#sending-persisted-document-requests-from-your-app).

  The previous slash-separated format (`appName/appVersion/documentId`) is now **deprecated** but still accepted as a fallback. Migrate clients to the tilde separator; support for the slash format may be removed in a future major release.

## 0.1.1

### Patch Changes

- 737b276: Update dependencies

## 0.1.0

### Minor Changes

- fb0c05e: Migrate all packages to a mono-repo

## 0.0.4

### Patch Changes

- 56d6acf: Add logic to retry fetching documents from remote store

## 0.0.3

### Patch Changes

- 3ca71e1: Replace keyv by generic interface based cache

## 0.0.2

### Patch Changes

- 160a564: Resolve automated release process issue

## 0.0.1

### Patch Changes

- 4e0475a: Return GraphQL error when document id is required and missing
- 4ccc0e0: Initial version with support for trusted documents via Hive
- 47941ff: Support both documentId and query in the same request (non-strict)
