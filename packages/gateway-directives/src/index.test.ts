import assert from "node:assert";
import type {
	BaseContext,
	GraphQLRequestContextDidResolveOperation,
} from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { type GraphQLSchema, parse } from "graphql";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { type DirectiveHooks, GatewayDirectivesPlugin } from ".";

describe("GatewayDirectivesPlugin", () => {
	let schema: GraphQLSchema;
	let plugin: GatewayDirectivesPlugin<BaseContext>;
	let hooks: DirectiveHooks<unknown>;

	const testOperations: {
		name: string;
		opName: string;
		flagValue: boolean;
		requestContext: GraphQLRequestContextDidResolveOperation<BaseContext>;
		requestContextWithoutDirective: GraphQLRequestContextDidResolveOperation<BaseContext>;
	}[] = [
		{
			name: "mutation",
			opName: "doSomething",
			flagValue: true,
			requestContext: {
				contextValue: {},
				document: parse(/* GraphQL */ `
					mutation {
						doSomething
						doOtherThing
					}
				`),
			} as GraphQLRequestContextDidResolveOperation<BaseContext>,
			requestContextWithoutDirective: {
				contextValue: {},
				document: parse(/* GraphQL */ `
					mutation {
						doOtherThing
					}
				`),
			} as GraphQLRequestContextDidResolveOperation<BaseContext>,
		},
		{
			name: "query",
			opName: "hello",
			flagValue: false,
			requestContext: {
				contextValue: {},
				document: parse(/* GraphQL */ `
					query {
						hello
						bye
					}
				`),
			} as GraphQLRequestContextDidResolveOperation<BaseContext>,
			requestContextWithoutDirective: {
				contextValue: {},
				document: parse(/* GraphQL */ `
					query {
						bye
					}
				`),
			} as GraphQLRequestContextDidResolveOperation<BaseContext>,
		},
		{
			name: "subscription",
			opName: "thisSubscription",
			flagValue: true,
			requestContext: {
				contextValue: {},
				document: parse(/* GraphQL */ `
					subscription {
						thisSubscription
						thatSubscription
					}
				`),
			} as GraphQLRequestContextDidResolveOperation<BaseContext>,
			requestContextWithoutDirective: {
				contextValue: {},
				document: parse(/* GraphQL */ `
					subscription {
						thatSubscription
					}
				`),
			} as GraphQLRequestContextDidResolveOperation<BaseContext>,
		},
	];

	beforeEach(() => {
		// A dummy directive definition + mutation
		const typeDefs = /* GraphQL */ `
      directive @myDirective(flag: Boolean) on FIELD_DEFINITION

      type Mutation {
        doSomething: Boolean @myDirective(flag: true)
        doOtherThing: Boolean
      }

      type Query {
        hello: String @myDirective(flag: false)
		bye: String
      }

	  type Subscription {
		thisSubscription: Int @myDirective(flag: true)
		thatSubscription: Int
	  }
    `;

		schema = makeExecutableSchema({ typeDefs });

		// Mock hooks; we'll spy on them
		hooks = {
			myDirective: vi.fn(async (args, context) => {
				// do whatever
			}),
		};

		plugin = new GatewayDirectivesPlugin<BaseContext>(hooks);
	});

	test.each(testOperations)(
		"should parse $name directives in the schema",
		({ opName, flagValue }) => {
			// WHEN we parse the schema
			plugin.parseSchema(schema);

			const directive = plugin.directives.get(opName);
			expect(directive).toBeDefined();

			// operation has exactly 1 directive: `myDirective`
			expect(directive?.size).toBe(1);
			expect(directive?.has("myDirective")).toBe(true);

			// The directive arguments should have { flag: true }
			const doSomethingDirectiveArgs = directive?.get("myDirective");
			expect(doSomethingDirectiveArgs).toStrictEqual({ flag: flagValue });
		},
	);

	test.each(testOperations)(
		"should invoke hook on $name fields that have directives",
		async ({ requestContext, flagValue }) => {
			plugin.parseSchema(schema);

			// The plugin returns a listener with didResolveOperation
			const listener = await plugin.requestDidStart(requestContext);
			assert(
				listener.didResolveOperation,
				"Expected listener to have didResolveOperation",
			);
			await listener.didResolveOperation(requestContext);

			// The field has the directive @myDirective, so the hook should be called.
			expect(hooks.myDirective).toHaveBeenCalledTimes(1);
			expect(hooks.myDirective).toHaveBeenCalledWith(
				{ flag: flagValue }, // arguments from directive
				requestContext.contextValue,
			);

			// The other queried field has no directives, so no calls from that.
		},
	);

	test.each(testOperations)(
		"should not break if $name has no directive",
		async ({ requestContextWithoutDirective }) => {
			plugin.parseSchema(schema);

			const listener = await plugin.requestDidStart(
				requestContextWithoutDirective,
			);
			assert(
				listener.didResolveOperation,
				"Expected listener to have didResolveOperation",
			);
			await listener.didResolveOperation(requestContextWithoutDirective);

			// "doOtherThing" has no directive, so we do NOT expect the hook to be called
			expect(hooks.myDirective).not.toHaveBeenCalled();
		},
	);
});
