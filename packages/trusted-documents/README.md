# Apollo Trusted Documents Plugin

This plugin enables support for trusted documents (persisted queries) in Apollo Server, with built-in support for GraphQL Hive's App Deployments.

## Installation

```bash
pnpm add @labdigital/apollo-trusted-documents
```

## Usage

### With GraphQL Hive

```ts
import { ApolloServer } from "@apollo/server";
import { TrustedDocumentsPlugin, HiveStore } from "@labdigital/apollo-trusted-documents";
import Keyv from "keyv";

// Create a cache for the documents (e.g., using Keyv)
const cache = new Keyv();

const trustedDocumentsPlugin = new TrustedDocumentsPlugin({
  store: new HiveStore({
    endpoint: "https://cdn.graphql-hive.com",
    accessToken: process.env.HIVE_CDN_ACCESS_TOKEN,
    cache,
  }),
  // Optional: strict mode (default: true)
  // When enabled, only trusted documents are allowed
  strict: true,
  // Optional: bypass header for development/testing
  bypassHeader: "x-bypass-trusted-operations",
  bypassSecret: process.env.BYPASS_SECRET,
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [trustedDocumentsPlugin],
});

await server.start();
```

### Custom Document Store

You can implement your own document store by implementing the `DocumentStore` interface:

```ts
import type { DocumentStore } from "@labdigital/apollo-trusted-documents";

class MyCustomStore implements DocumentStore {
  async get(documentId: string): Promise<string | undefined> {
    // Fetch the document from your custom store
    return myDatabase.getDocument(documentId);
  }
}

const trustedDocumentsPlugin = new TrustedDocumentsPlugin({
  store: new MyCustomStore(),
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `store` | `DocumentStore` | - | The document store to use for fetching trusted documents |
| `strict` | `boolean` | `true` | When enabled, only trusted documents are allowed |
| `bypassHeader` | `string` | `"x-bypass-trusted-operations"` | Header name to check for bypass secret |
| `bypassSecret` | `string` | - | Secret value to allow bypassing trusted documents check |
