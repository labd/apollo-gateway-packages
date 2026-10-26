# @labdigital/apollo-server-integration-fastify

[![npm](https://img.shields.io/npm/v/@labdigital/apollo-server-integration-fastify)](https://www.npmjs.com/package/@labdigital/apollo-server-integration-fastify)

A Fastify plugin that serves an Apollo Server instance on a Fastify route. It
converts Fastify requests into Apollo `HTTPGraphQLRequest`s, supports
streamed (incremental delivery) responses, and ships an Apollo plugin that
drains the Fastify server on shutdown. The code is based on
[apollo-server-integrations/apollo-server-integration-fastify](https://github.com/apollo-server-integrations/apollo-server-integration-fastify)
and the discussion in
[issue #296](https://github.com/apollo-server-integrations/apollo-server-integration-fastify/issues/296).

This package is ESM-only.

## Installation

```sh
pnpm add @labdigital/apollo-server-integration-fastify
# or
npm install @labdigital/apollo-server-integration-fastify
```

## Requirements

- Node.js >= 22.19
- Peer dependencies:
  - `@apollo/server` `^4.0.0 || ^5.0.0`
  - `fastify` `^5.0.0`

## Usage

```ts
import { ApolloServer } from "@apollo/server";
import {
  fastifyApollo,
  fastifyApolloDrainPlugin,
} from "@labdigital/apollo-server-integration-fastify";
import Fastify from "fastify";

const fastify = Fastify();

const apollo = new ApolloServer({
  typeDefs: `type Query { hello: String }`,
  resolvers: { Query: { hello: () => "Hello world" } },
  plugins: [fastifyApolloDrainPlugin(fastify)],
});

// The Apollo server must be started before calling fastifyApollo()
await apollo.start();

await fastify.register(fastifyApollo(apollo));

await fastify.listen({ port: 4000 });
```

### Context

Pass a `context` function to build the GraphQL context from the Fastify
request and reply:

```ts
import { ApolloServer } from "@apollo/server";
import {
  type ApolloFastifyContextFunction,
  type FastifyApolloPluginOptions,
  fastifyApollo,
} from "@labdigital/apollo-server-integration-fastify";
import Fastify from "fastify";

interface MyContext {
  authorization?: string;
}

const context: ApolloFastifyContextFunction<MyContext> = async (
  request,
  _reply,
) => ({
  authorization: request.headers.authorization,
});

const fastify = Fastify();

const apollo = new ApolloServer<MyContext>({
  typeDefs: `type Query { me: String }`,
  resolvers: {
    Query: { me: (_parent, _args, ctx: MyContext) => ctx.authorization },
  },
});
await apollo.start();

const options: FastifyApolloPluginOptions<MyContext> = {
  path: "/api/graphql",
  context,
};

await fastify.register(fastifyApollo(apollo), options);
```

## API

### `fastifyApollo(apollo)`

Returns a Fastify plugin (wrapped with `fastify-plugin`, Fastify 5.x) that
registers the GraphQL route. Throws if no Apollo server is passed or if it has
not been started.

### `fastifyApolloDrainPlugin(fastify)`

Returns an Apollo Server plugin that calls `fastify.close()` when the Apollo
server stops. If closing takes longer than 10 seconds, it force-closes all open
connections.

## Configuration

Options passed as the second argument of `fastify.register()`:

| Option    | Type                                                  | Default                       | Description                                       |
| --------- | ----------------------------------------------------- | ----------------------------- | ------------------------------------------------- |
| `path`    | `string`                                              | `"/graphql"`                  | URL of the GraphQL route.                         |
| `method`  | `"GET" \| "POST" \| "OPTIONS"` or an array of these   | `["GET", "POST", "OPTIONS"]`  | HTTP method(s) the route accepts.                 |
| `context` | `ApolloFastifyContextFunction<Context>`               | returns `{}`                  | Builds the GraphQL context from `request, reply`. |

The exported types are `ApolloFastifyContextFunction` and
`FastifyApolloPluginOptions`.

`fastifyApollo()` returns a plain `FastifyPluginAsync`, so Fastify does not
know the option types. Passing the options inline as an object literal to
`fastify.register()` can fail type checking with "Object literal may only
specify known properties". Declare them as `FastifyApolloPluginOptions<Context>`
first, as in the context example above.

## Development

This package lives in the
[apollo-gateway-packages](https://github.com/labd/apollo-gateway-packages)
monorepo. From the repository root:

```sh
pnpm install
pnpm build      # build all packages (turbo + tsdown)
pnpm test       # run tests with vitest
pnpm lint       # biome check
pnpm typecheck  # tsc --noEmit for all packages
```

## Release

Releases are managed with [changesets](https://github.com/changesets/changesets).
Add a changeset describing your change:

```sh
pnpm changeset
```

When the changeset is merged into `main`, the release workflow opens a version
PR and publishes the package to npm once that PR is merged.

## License

MIT
