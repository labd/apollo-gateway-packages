export interface DocumentStore {
	get(documentId: string): Promise<string | undefined>;
}
