import { fetchWithRetry } from "./fetch";
import type { DocumentCache, DocumentStore } from "./store-base";

type HiveOptions = {
	endpoint: string;
	accessToken: string;
	cache: DocumentCache<string | null>;
};

export class HiveStore implements DocumentStore {
	private cache: DocumentCache<string | null>;

	constructor(private options: HiveOptions) {
		this.cache = options.cache;
	}

	async get(documentId: string): Promise<string | undefined> {
		let document: string | undefined | null;
		try {
			document = await this.cache.get(documentId);
		} catch (e) {
			console.error(e);
		}
		if (document !== undefined) {
			return document ? document : undefined;
		}

		// Validate the documentId before trying to fetch it. The format should be
		// `app/version/query-hash`
		if (!/^[a-z0-9-]+\/[a-z0-9-]+\/[0-9a-z]+$/.test(documentId)) {
			console.error("invalid documentId received");
			return undefined;
		}

		const url = `${this.options.endpoint}/apps/${documentId}`;
		document = await fetchWithRetry(url, {
			headers: {
				"X-Hive-CDN-Key": this.options.accessToken,
			},
		})
			.then(async (res) => {
				if (res.ok) {
					return await res.text();
				}
				return null;
			})
			.catch((error) => {
				console.error("failed to fetch document from hive: ", error);
				return null;
			});

		// Also set null values
		await this.cache.set(documentId, document);
		return document ? document : undefined;
	}
}
