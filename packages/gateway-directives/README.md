# Apollo Gateway Directives Plugin

This plugin allows you to handle GraphQL directives within Apollo Gateway.

## Installation

```bash
pnpm add @labdigital/apollo-gateway-directives
```

## Usage

```ts
import { GatewayDirectivesPlugin } from '@labdigital/apollo-gateway-directives';
import type { BaseContext } from "@apollo/server";
import { buildSchema } from "graphql";

type ContextValue extends BaseContext {
  foobar: string;
}

const directivesPlugin = new GatewayDirectivesPlugin<ContextValue>({
  // Define the directive handlers here
  myDirective: async (
    args: Record<string, unknown>,
    context: ContextValue,
  ) => {
    // Do something with the directive
  }
});

const gateway = new ApolloGateway({
  // ...
});

gateway.onSchemaLoadOrUpdate((schema) => {
  // Parse the schema ourselves since `schema.apiSchema` has not all
  // directives available. See https://github.com/apollographql/federation/issues/2895
  const sdl = buildSchema(schema.coreSupergraphSdl);
  directivesPlugin.parseSchema(sdl);
});

const server = new ApolloServer({
  gateway,
  plugins: [
    directivesPlugin,
  ]
});

await server.start();
```
