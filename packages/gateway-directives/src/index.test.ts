import assert from "node:assert";
import type { BaseContext } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { type GraphQLSchema, parse } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type DirectiveHooks, GatewayDirectivesPlugin } from ".";

describe("GatewayDirectivesPlugin", () => {
	let schema: GraphQLSchema;
	let plugin: GatewayDirectivesPlugin<BaseContext>;
	let hooks: DirectiveHooks<unknown>;

	beforeEach(() => {
		// A dummy directive definition + mutation
		const typeDefs = /* GraphQL */ `
      directive @myDirective(flag: Boolean) on FIELD_DEFINITION

      type Mutation {
        doSomething: Boolean @myDirective(flag: true)
        doOtherThing: Boolean
      }

      type Query {
        hello: String
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

	it("should parse directives in the schema", () => {
		// WHEN we parse the schema
		plugin.parseSchema(schema);

		// THEN: we should have discovered our directive usage
		// Because we have exactly 1 directive usage on `doSomething`
		expect(plugin.directives.size).toBe(1);
		expect(plugin.directives.has("doSomething")).toBe(true);

		const doSomethingDirectives = plugin.directives.get("doSomething");
		expect(doSomethingDirectives).toBeDefined();

		// `doSomething` has exactly 1 directive: `myDirective`
		expect(doSomethingDirectives?.size).toBe(1);
		expect(doSomethingDirectives?.has("myDirective")).toBe(true);

		// The directive arguments should have { flag: true }
		const myDirectiveArgs = doSomethingDirectives?.get("myDirective");
		expect(myDirectiveArgs).toStrictEqual({ flag: true });
	});

	it("should invoke hook on mutation fields that have directives", async () => {
		plugin.parseSchema(schema);

		// Setup plugin request flow
		const requestContext = {
			contextValue: {}, // your GraphQL context
			document: parse(/* GraphQL */ `
        mutation {
          doSomething
          doOtherThing
        }
      `),
		} as any; // Type assertion so we can pass a partial or custom object

		// The plugin returns a listener with didResolveOperation
		const listener = await plugin.requestDidStart(requestContext);
		assert(
			listener.didResolveOperation,
			"Expected listener to have didResolveOperation",
		);
		await listener.didResolveOperation(requestContext);

		// "doSomething" has the directive @myDirective, so the hook should be called.
		expect(hooks.myDirective).toHaveBeenCalledTimes(1);
		expect(hooks.myDirective).toHaveBeenCalledWith(
			{ flag: true }, // arguments from directive
			requestContext.contextValue,
		);

		// "doOtherThing" has no directives, so no calls from that.
	});

	it("should not break if mutation has no directive", async () => {
		plugin.parseSchema(schema);

		const requestContext = {
			contextValue: {},
			document: parse(/* GraphQL */ `
        mutation {
          doOtherThing
        }
      `),
		} as any;

		const listener = await plugin.requestDidStart(requestContext);
		assert(
			listener.didResolveOperation,
			"Expected listener to have didResolveOperation",
		);
		await listener.didResolveOperation(requestContext);

		// "doOtherThing" has no directive, so we do NOT expect the hook to be called
		expect(hooks.myDirective).not.toHaveBeenCalled();
	});
});
