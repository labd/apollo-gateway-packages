import fetchRetry from "fetch-retry";

// Default settings for fetch-retry. Note that inline arrow function, which is
// used to be compatible with msw.
// See https://github.com/jonbern/fetch-retry/issues/95#issuecomment-2613990480
export const fetchWithRetry = fetchRetry((...args) => global.fetch(...args), {
	retries: 5,
	retryDelay: (attempt, error, response) => {
		return 2 ** attempt * 100; // 100, 200, 400
	},
});
