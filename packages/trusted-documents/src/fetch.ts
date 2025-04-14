export const fetchWithRetry = async (
	url: string,
	options: RequestInit = {},
	retries = 3,
	initialDelay = 100,
): Promise<Response> => {
	let delay = initialDelay;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const response = await fetch(url, options);

			if (!response.ok) {
				console.error(
					`Failed to fetch data from ${url} status: ${response.status}`,
				);
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response;
		} catch (err: unknown) {
			if (attempt >= retries) {
				throw err;
			}

			// Wait for the current delay before retrying
			await new Promise((resolve) => setTimeout(resolve, delay));

			// Increase the delay (exponential backoff)
			delay = Math.min(delay * 2, 1000); // Cap at 1000ms
		}
	}

	throw new Error("Internal error");
};
