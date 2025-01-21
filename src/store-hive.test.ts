import { Keyv } from "keyv";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { HiveStore } from "./store-hive";

const server = setupServer();

describe("HiveStore", () => {
	beforeAll(() => {
		server.listen({ onUnhandledRequest: "error" });
	});
	afterEach(() => {
		server.resetHandlers();
	});
	afterAll(() => {
		server.close();
	});

	it("should return the document from the cache if available", async () => {
		const cache = new Keyv({ store: new Map() });

		const documentId = "my-app/version-1/hash";
		const cachedDocument = "Cached Document Content";
		await cache.set(documentId, cachedDocument);

		const hiveStore = new HiveStore({
			endpoint: "https://example.com",
			accessToken: "test-access-token",
			cache: cache,
		});

		const result = await hiveStore.get(documentId);

		expect(result).toBe(cachedDocument);
	});

	it("should fetch the document from the endpoint if not in cache", async () => {
		const cache = new Keyv({ store: new Map() });
		const hiveStore = new HiveStore({
			endpoint: "https://example.com",
			accessToken: "test-access-token",
			cache: cache,
		});

		const documentId = "my-app/version-1/hash";
		const fetchedDocument = "Fetched Document Content";

		server.use(
			http.get(`https://example.com/apps/${documentId}`, ({ request }) => {
				if (request.headers.get("X-Hive-CDN-Key") !== "test-access-token") {
					return HttpResponse.error();
				}
				return HttpResponse.text(fetchedDocument);
			}),
		);

		const result = await hiveStore.get(documentId);
		expect(result).toBe(fetchedDocument);
	});

	it.skip("should return undefined if the fetch fails", async () => {
		const cache = new Keyv<string | null>({ store: new Map() });
		const hiveStore = new HiveStore({
			endpoint: "https://example.com",
			accessToken: "test-access-token",
			cache: cache,
		});

		const documentId = "my-app/version-1/hash";
		const fetchedDocument = "Fetched Document Content";

		server.use(
			http.get(`https://example.com/apps/${documentId}`, ({ request }) => {
				if (request.headers.get("X-Hive-CDN-Key") !== "other-access-token") {
					return HttpResponse.error();
				}
				return HttpResponse.text(fetchedDocument);
			}),
		);

		const result = await hiveStore.get(documentId);

		expect(result).toBeUndefined();
	});
});
