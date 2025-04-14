import type { IncomingHttpHeaders } from "node:http";
import { Readable } from "node:stream";
import {
	type ApolloServer,
	type ApolloServerPlugin,
	type BaseContext,
	type GraphQLServerListener,
	type HTTPGraphQLRequest,
	HeaderMap,
} from "@apollo/server";
import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
	RouteHandlerMethod,
} from "fastify";
import fastifyPlugin from "fastify-plugin";
import type {
	ApolloFastifyContextFunction,
	ApolloFastifyHandlerOptions,
	FastifyApolloPluginContext,
} from "./types";

export const fastifyApollo = <Context extends BaseContext = BaseContext>(
	apollo: ApolloServer<Context>,
): FastifyPluginAsync => {
	if (!apollo) throw new Error("Apollo server instance is not provided");

	apollo.assertStarted("fastifyApollo()");

	const fastifyRequestToGraphQLRequest = (
		request: FastifyRequest,
	): HTTPGraphQLRequest => {
		const httpHeadersToMap = (headers: IncomingHttpHeaders): HeaderMap => {
			const map = new HeaderMap();

			for (const [key, value] of Object.entries(headers)) {
				if (value) {
					map.set(key, Array.isArray(value) ? value.join(", ") : value);
				}
			}

			return map;
		};

		return {
			body: request.body,
			method: request.method.toUpperCase(),
			headers: httpHeadersToMap(request.headers),
			search: new URL(request.url, `${request.protocol}://${request.host}/`)
				.search,
		};
	};

	const fastifyApolloHandler = <Context extends BaseContext>(
		apollo: ApolloServer<Context>,
		options: ApolloFastifyHandlerOptions<Context>,
	): RouteHandlerMethod => {
		const defaultContext: ApolloFastifyContextFunction<Context> = () =>
			Promise.resolve({} as Context);

		const contextFunction = options?.context ?? defaultContext;

		return async (
			request: FastifyRequest,
			reply: FastifyReply,
		): Promise<string> => {
			const httpGraphQLResponse = await apollo.executeHTTPGraphQLRequest({
				httpGraphQLRequest: fastifyRequestToGraphQLRequest(request),
				context: () => contextFunction(request, reply),
			});

			const { headers, body, status } = httpGraphQLResponse;

			for (const [headerKey, headerValue] of headers) {
				void reply.header(headerKey, headerValue);
			}

			void reply.code(status === undefined ? 200 : status);

			if (body.kind === "complete") {
				return body.string;
			}

			const readable = Readable.from(body.asyncIterator);

			return reply.send(readable);
		};
	};

	const plugin = async (
		fastify: FastifyInstance,
		options: FastifyApolloPluginContext<Context>,
	) => {
		const {
			path = "/graphql",
			method = ["GET", "POST", "OPTIONS"],
			...handlerOptions
		} = options;

		fastify.route({
			method,
			url: path,
			handler: fastifyApolloHandler<Context>(apollo, handlerOptions),
		});
	};
	return fastifyPlugin(plugin, {
		name: "@labdigital/apollo-server-integration-fastify",
		fastify: "5.x",
	});
};

export const fastifyApolloDrainPlugin = (
	fastify: FastifyInstance,
): ApolloServerPlugin => {
	return {
		async serverWillStart(): Promise<GraphQLServerListener> {
			return {
				async drainServer(): Promise<void> {
					if ("closeAllConnections" in fastify.server) {
						// If fastify.close() takes longer than 10 seconds - run the logic to force close all connections
						const timeout = setTimeout(() => {
							fastify.server.closeAllConnections();
						}, 10_000);

						await fastify.close();
						clearTimeout(timeout);
					}
				},
			};
		},
	};
};
