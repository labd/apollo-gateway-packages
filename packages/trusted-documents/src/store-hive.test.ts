import { Keyv } from "keyv";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { HiveStore } from "./store-hive";

const server = setupServer();

describe("HiveStore", () => {
	beforeAll(() => {
		server.listen({ onUnhandledFrame: "error" });
	});
	afterEach(() => {
		server.resetHandlers();
		vi.useRealTimers();
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

	it("should fetch tilde-separated document ids from the endpoint", async () => {
		const cache = new Keyv({ store: new Map() });
		const hiveStore = new HiveStore({
			endpoint: "https://example.com",
			accessToken: "test-access-token",
			cache: cache,
		});

		const documentId = "my-app~version-1~hash";
		const fetchedDocument = "Fetched Document Content";

		server.use(
			http.get(
				"https://example.com/apps/my-app/version-1/hash",
				({ request }) => {
					if (request.headers.get("X-Hive-CDN-Key") !== "test-access-token") {
						return HttpResponse.error();
					}
					return HttpResponse.text(fetchedDocument);
				},
			),
		);

		const result = await hiveStore.get(documentId);
		expect(result).toBe(fetchedDocument);
	});

	it("should return undefined if the fetch has a network error", async () => {
		const cache = new Keyv<string | null>({ store: new Map() });
		const hiveStore = new HiveStore({
			endpoint: "https://example.com",
			accessToken: "test-access-token",
			cache: cache,
		});

		const documentId = "my-app/version-1/hash";
		const fetchedDocument = "Fetched Document Content";

		let count = 0;
		server.use(
			http.get(`https://example.com/apps/${documentId}`, ({ request }) => {
				count += 1;
				if (count < 4) {
					return HttpResponse.error();
				}
				return HttpResponse.text(fetchedDocument);
			}),
		);

		const result = await hiveStore.get(documentId);

		expect(result).toBe(fetchedDocument);
	});

	it("should return undefined if the fetch fails", async () => {
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
					return HttpResponse.json(
						{
							message: "Unauthorized",
						},
						{
							status: 401,
						},
					);
				}
				return HttpResponse.text(fetchedDocument);
			}),
		);

		const result = await hiveStore.get(documentId);

		expect(result).toBeUndefined();
	});

	it("should not cache a failed fetch", async () => {
		const cache = new Keyv<string | null>({ store: new Map() });
		const hiveStore = new HiveStore({
			endpoint: "https://example.com",
			accessToken: "test-access-token",
			cache: cache,
		});

		const documentId = "my-app/version-1/hash";
		const fetchedDocument = "Fetched Document Content";

		let count = 0;
		server.use(
			http.get(`https://example.com/apps/${documentId}`, () => {
				count += 1;
				if (count === 1) {
					return new HttpResponse(null, { status: 503 });
				}
				return HttpResponse.text(fetchedDocument);
			}),
		);

		expect(await hiveStore.get(documentId)).toBeUndefined();
		expect(await hiveStore.get(documentId)).toBe(fetchedDocument);
	});

	it("should not cache a network error", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout"] });

		const cache = new Keyv<string | null>({ store: new Map() });
		const hiveStore = new HiveStore({
			endpoint: "https://example.com",
			accessToken: "test-access-token",
			cache: cache,
		});

		const documentId = "my-app/version-1/hash";
		const fetchedDocument = "Fetched Document Content";

		server.use(
			http.get(`https://example.com/apps/${documentId}`, () => {
				return HttpResponse.error();
			}),
		);

		const pending = hiveStore.get(documentId);
		await vi.runAllTimersAsync();
		expect(await pending).toBeUndefined();

		server.use(
			http.get(`https://example.com/apps/${documentId}`, () => {
				return HttpResponse.text(fetchedDocument);
			}),
		);

		expect(await hiveStore.get(documentId)).toBe(fetchedDocument);
	});

	it("should cache a document that does not exist", async () => {
		const cache = new Keyv<string | null>({ store: new Map() });
		const hiveStore = new HiveStore({
			endpoint: "https://example.com",
			accessToken: "test-access-token",
			cache: cache,
		});

		const documentId = "my-app/version-1/hash";

		let count = 0;
		server.use(
			http.get(`https://example.com/apps/${documentId}`, () => {
				count += 1;
				return new HttpResponse(null, { status: 404 });
			}),
		);

		expect(await hiveStore.get(documentId)).toBeUndefined();
		expect(await hiveStore.get(documentId)).toBeUndefined();
		expect(count).toBe(1);
	});
});
