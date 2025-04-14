export interface DocumentStore {
	get(documentId: string): Promise<string | undefined>;
}

export interface DocumentCache<T> {
	get(documentId: string): Promise<T | undefined>;
	set(documentId: string, document: T): Promise<void | boolean>;
}
