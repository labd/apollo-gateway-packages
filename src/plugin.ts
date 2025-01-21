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
	strict?: boolean;
	bypassSecret?: string;
	bypassHeader?: string;
};

const pluginDefaults: Partial<PluginOptions> = {
	bypassHeader: "x-bypass-trusted-operations",
	strict: true,
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
			const body = request.http?.body as {
				documentId?: string;
				extensions?: Record<string, unknown>;
			};

			// If we have a documentId we use that and remove the
			// extensions.persistedQueries as this only causes confusion downstream
			if (body.documentId) {
				documentId = body.documentId;
				body.documentId = undefined;
				if (body.extensions?.persistedQuery) {
					body.extensions.persistedQuery = undefined;
				}
			}
		}

		// IF GET, extract from search params
		if (request.http?.method === "GET" && request.http?.search) {
			const qs = querystring.parse(request.http?.search.substring(1));
			if (qs.documentId) {
				documentId = Array.isArray(qs.documentId)
					? qs.documentId[0]
					: qs.documentId;

				// Remove the documentId and extensions from the query string
				qs.documentId = undefined;
				qs.extensions = undefined;
				request.http.search = "?" + querystring.stringify(qs);
			}
		}

		if (documentId) {
			const query = await this.options.store.get(documentId);

			if (!query) {
				if (this.options.strict) {
					throw new GraphQLError("No persisted query found");
				} else {
					console.error("No persisted query found for documentId", documentId);
				}
			}

			if (query) {
				request.query = query;
				if (request.extensions?.persistedQuery) {
					request.extensions.persistedQuery = undefined;
				}
			}
		}
	}
}
