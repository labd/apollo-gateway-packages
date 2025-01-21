import querystring from "node:querystring";
import type {
	ApolloServerPlugin,
	BaseContext,
	GraphQLRequestContext,
} from "@apollo/server";
import { GraphQLError } from "graphql";
import type { DocumentStore } from "./store-base";

type PluginOptions = {
	store?: DocumentStore;
	bypassSecret?: string;
	bypassHeader?: string;
};

const pluginDefaults: Partial<PluginOptions> = {
	bypassHeader: "x-bypass-trusted-operations",
};

export class TrustedDocumentsPlugin<TContext extends BaseContext>
	implements ApolloServerPlugin
{
	private options: PluginOptions;

	constructor(options: PluginOptions) {
		this.options = { ...pluginDefaults, ...options };
	}

	public async requestDidStart(
		requestContext: GraphQLRequestContext<TContext>,
	): Promise<void> {
		const { request } = requestContext;
		let documentId: string | undefined;

		if (!this.options.store) {
			return;
		}

		if (this.options.bypassSecret && this.options.bypassHeader) {
			const headerValue = request.http?.headers.get(this.options.bypassHeader);
			if (headerValue === this.options.bypassSecret) {
				return;
			}
		}

		// IF POST, extract from body
		if (request.http?.method === "POST") {
			const body = request.http?.body as { documentId?: string };
			documentId = body.documentId;

			body.documentId = undefined;
		}

		// IF GET, extract from search params
		if (request.http?.method === "GET" && request.http?.search) {
			const qs = querystring.parse(request.http?.search.substring(1));
			if (qs.documentId) {
				documentId = Array.isArray(qs.documentId)
					? qs.documentId[0]
					: qs.documentId;
			}
		}

		if (documentId) {
			const query = await this.options.store.get(documentId);

			if (!query) {
				throw new GraphQLError("No persisted query found");
			}

			request.query = query;
			if (request.extensions?.persistedQueries) {
				request.extensions.persistedQueries = undefined;
			}
		}
	}
}
