---
"@labdigital/apollo-trusted-documents": patch
---

`HiveStore` no longer caches a failed fetch from the Hive CDN. Only a 404 is cached as a missing document; a network error or any other status is fetched again on the next request instead of hiding the document for as long as the cache keeps the entry.
