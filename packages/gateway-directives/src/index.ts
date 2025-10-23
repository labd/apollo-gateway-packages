import type {
	ApolloServerPlugin,
	BaseContext,
	GraphQLRequestContext,
	GraphQLRequestContextDidResolveOperation,
	GraphQLRequestListener,
} from "@apollo/server";
import {
	type DirectiveNode,
	type GraphQLField,
	type GraphQLSchema,
	Kind,
	OperationTypeNode,
} from "graphql";

export type DirectiveMap = Map<
	string,
	Map<string, Record<string, string | boolean>>
>;

export type DirectiveHooks<TContext> = Record<
	string,
	(args: Record<string, unknown>, context: TContext) => Promise<void>
>;

export class GatewayDirectivesPlugin<TContext extends BaseContext>
	implements ApolloServerPlugin
{
	directives: Map<string, Map<string, Record<string, string | boolean>>>;

	constructor(private hooks: DirectiveHooks<TContext>) {
		this.directives = new Map<
			string,
			Map<string, Record<string, string | boolean>>
		>();
	}

	public async requestDidStart(
		requestContext: GraphQLRequestContext<TContext>,
	): Promise<GraphQLRequestListener<TContext>> {
		return new GatewayDirectivesListener(this.directives, this.hooks);
	}

	public parseSchema(schema: GraphQLSchema): void {
		this.directives.clear();

		const directiveNames: string[] = Object.keys(this.hooks);

		for (const [field, directive] of filterDirectives(schema, directiveNames)) {
			let fieldDirectives = this.directives.get(field.name);
			if (!fieldDirectives) {
				fieldDirectives = new Map();
				this.directives.set(field.name, fieldDirectives);
			}

			const args = parseDirectiveArgs(directive);
			fieldDirectives.set(directive.name.value, args);
		}
	}
}

class GatewayDirectivesListener<TContext extends BaseContext>
	implements GraphQLRequestListener<TContext>
{
	constructor(
		private directives: DirectiveMap,
		private hooks: DirectiveHooks<TContext>,
	) {}

	public async didResolveOperation(
		requestContext: GraphQLRequestContextDidResolveOperation<TContext>,
	): Promise<void> {
		const document = requestContext.document;

		for (const definition of document.definitions) {
			if (
				definition.kind === Kind.OPERATION_DEFINITION &&
				definition.operation === OperationTypeNode.MUTATION
			) {
				for (const selection of definition.selectionSet.selections) {
					if (
						selection.kind === Kind.FIELD &&
						this.directives.has(selection.name.value)
					) {
						const directives = this.directives.get(selection.name.value);
						if (!directives) {
							continue;
						}

						for (const [name, args] of directives) {
							if (this.hooks[name]) {
								await this.hooks[name](args, requestContext.contextValue);
							}
						}
					}
				}
			}
		}
	}
}

function* filterDirectives(
	schema: GraphQLSchema,
	names: string[],
): Generator<[GraphQLField<unknown, unknown, unknown>, DirectiveNode]> {
	const m = schema.getMutationType();
	if (!m) {
		return;
	}

	for (const [key, value] of Object.entries(m.getFields())) {
		if (!value.astNode?.directives) {
			continue;
		}

		for (const directive of value.astNode.directives) {
			if (names.includes(directive.name.value)) {
				yield [value, directive];
			}
		}
	}
}

function parseDirectiveArgs(
	directive: DirectiveNode,
): Record<string, string | boolean> {
	if (!directive.arguments) {
		return {};
	}

	return Object.fromEntries(
		directive.arguments.map((d) => {
			switch (d.value.kind) {
				case Kind.BOOLEAN:
					return [d.name.value, d.value.value];
				case Kind.LIST:
					return [d.name.value, d.value.values];
				default:
					throw new Error(`Unsupported value kind: ${d.value.kind}`);
			}
		}),
	);
}
