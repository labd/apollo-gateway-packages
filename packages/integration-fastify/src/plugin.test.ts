import { ApolloServer } from "@apollo/server";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fastifyApollo, fastifyApolloDrainPlugin } from "./index";

describe("Fastify Apollo Integration", () => {
	let fastifyInstance: ReturnType<typeof Fastify>;
	let apolloServer: ApolloServer;

	beforeAll(async () => {
		// Setup Fastify server
		fastifyInstance = Fastify();

		// Setup Apollo Server
		apolloServer = new ApolloServer({
			typeDefs: `
        type Query {
          hello: String
        }
      `,
			resolvers: {
				Query: {
					hello: () => "Hello from Apollo Server with Fastify!",
				},
			},
			plugins: [fastifyApolloDrainPlugin(fastifyInstance)],
		});

		await apolloServer.start();

		// Register the Apollo plugin
		await fastifyInstance.register(fastifyApollo(apolloServer), {
			path: "/graphql",
		});

		// Start the Fastify server
		await fastifyInstance.listen({ port: 0 }); // Use a random available port
	});

	afterAll(async () => {
		await apolloServer.stop();
		await fastifyInstance.close();
	});

	it("should respond to GraphQL queries", async () => {
		const response = await fastifyInstance.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: "{ hello }",
			},
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.data.hello).toBe("Hello from Apollo Server with Fastify!");
	});
});
