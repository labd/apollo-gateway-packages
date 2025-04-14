import type { BaseContext, ContextFunction } from "@apollo/server";
import type {
	FastifyRegisterOptions,
	FastifyReply,
	FastifyRequest,
	HTTPMethods,
	RawServerBase,
	RawServerDefault,
	RouteGenericInterface,
} from "fastify";

type ValueOrArray<T> = T | T[];

export interface FastifyApolloPluginContext<Context extends BaseContext> {
	context?: ApolloFastifyContextFunction<Context>;
	path?: string;
	method?: ValueOrArray<Extract<HTTPMethods, "GET" | "POST" | "OPTIONS">>;
}

export type ApolloFastifyContextFunctionArgument<
	RawServer extends RawServerBase = RawServerDefault,
	RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
> = [
	request: FastifyRequest<RouteGeneric, RawServer>,
	reply: FastifyReply<RouteGeneric, RawServer>,
];

export type ApolloFastifyContextFunction<
	Context extends BaseContext,
	RawServer extends RawServerBase = RawServerDefault,
	RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
> = ContextFunction<
	ApolloFastifyContextFunctionArgument<RawServer, RouteGeneric>,
	Context
>;

export interface ApolloFastifyHandlerOptions<
	Context extends BaseContext = BaseContext,
	RawServer extends RawServerBase = RawServerDefault,
	RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
> {
	context?: ApolloFastifyContextFunction<Context, RawServer, RouteGeneric>;
}

export type FastifyApolloPluginOptions<Context extends BaseContext> =
	FastifyRegisterOptions<FastifyApolloPluginContext<Context>>;
