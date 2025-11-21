# Wikipedia API Rate Limits

This document outlines the rate limits and best practices for Wikipedia's various APIs.

**Primary Policy**: [Wikimedia Foundation API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) (Version 1.0, August 26, 2024) - This is the official policy that governs all API usage.

## API Endpoints Used

1. **REST API** (`en.wikipedia.org/api/rest_v1/`) - Article summaries (single), HTML, thumbnails, descriptions, random articles
2. **Action API** (`en.wikipedia.org/w/api.php`) - Search suggestions, categories, article links, backlinks, **batched article summaries** (up to 50 per request)
3. **Wikimedia API** (`api.wikimedia.org`) - Featured content
4. **Pageviews API** (`wikimedia.org/api/rest_v1`) - Trending articles
5. **Media API** (`upload.wikimedia.org`) - Images and media files (CDN, not an API)
6. **Commons Action API** (`commons.wikimedia.org/w/api.php`) - Media file lookups

**Note on Batching**: The Action API is used for batched operations (article summaries, links, backlinks) where multiple items can be requested in a single API call using pipe-separated titles.

## Rate Limits by API

### api.wikimedia.org

**Rate Limit**: 500 requests per hour per IP address (anonymous)

**Source**: [Wikimedia API Portal Rate Limits](https://api.wikimedia.org/wiki/Rate_limits) (referenced by Foundation API Usage Guidelines)

**Applies to**:

- `api.wikimedia.org` endpoints (featured content)

**Current Usage**: Featured content is fetched once per day (at midnight UTC) with smart retry logic, so this limit is never approached.

### REST API (`en.wikipedia.org/api/rest_v1/`)

**Rate Limits**:

- Concurrent requests: Less than 5 overall
- Requests per second: Below 10 requests/second

**Source**: [Robot Policy - REST API](https://wikitech.wikimedia.org/wiki/Robot_policy) (referenced by Foundation API Usage Guidelines)

**Used for**: Article summaries (single requests), HTML content, thumbnails, descriptions, random articles, featured content, trending articles

**Current Implementation**: Uses `restAxiosInstance` with 10 req/sec limit and up to 5 concurrent requests. Single article summary requests use this instance, while batched article summaries use the Action API.

### Action API (`en.wikipedia.org/w/api.php`)

**Rate Limits** (unauthenticated):

- Concurrency: 1 request at a time
- Requests per second: Below 5 requests/second overall

**Source**: [Robot Policy - Action API](https://wikitech.wikimedia.org/wiki/Robot_policy) (referenced by Foundation API Usage Guidelines)

**Used for**: Search suggestions, category pages, article links, backlinks, article categories, **batched article summaries** (up to 50 titles per request)

**Current Implementation**: Uses `actionAxiosInstance` with 5 req/sec limit, sequential (1 at a time). Batching functions (`fetchArticleSummaries`, `fetchArticleLinksBatch`, `fetchArticleBacklinksBatch`) automatically combine multiple titles into single requests using pipe separators (up to 50 titles per request).

### Pageviews API (`wikimedia.org/api/rest_v1`)

**Rate Limit**: No fixed limit, but client may be blocked if service stability is endangered

**Best Practice**: Wait for each request to finish before sending another request (serial requests)

**Source**: [Wikimedia Pageviews API Documentation](https://wikimedia.org/api/rest_v1/#/)

**Used for**: Trending articles

**Current Implementation**: Uses `actionAxiosInstance` to ensure serial requests (complies with "wait for each request to finish" requirement). Tries to fetch current date first, falls back to previous day if unavailable, then uses cached data. Retries every 15 minutes until successful (no rate limit on Pageviews API). Once successful, stops retrying until midnight UTC. This is a single-request operation (not batched).

### Commons Action API (`commons.wikimedia.org/w/api.php`)

**Rate Limits** (unauthenticated):

- Concurrency: 1 request at a time
- Requests per second: Below 5 requests/second overall

**Source**: [Robot Policy - Action API](https://wikitech.wikimedia.org/wiki/Robot_policy) (referenced by Foundation API Usage Guidelines) (same as main Action API)

**Used for**: Media file lookups and metadata

**Current Implementation**: Uses `actionAxiosInstance` with 5 req/sec limit, sequential (1 at a time). Single-request operations (not batched).

## Best Practices

These best practices come from the [Wikimedia Foundation API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) (Version 1.0, August 26, 2024), Robot Policy, and API Etiquette guidelines:

### 1. User-Agent Policy

**Guideline**: Follow the User-Agent policy and correctly label user agents with contact information.

**Source**: [Wikimedia Foundation API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) (August 26, 2024)

**Current Status**: `Api-User-Agent` headers with contact information are defined in in `api/shared/config.ts` and used across all axios instances. The `User-Agent` header is also defined and set on non-web platforms. Browsers automatically send their own `User-Agent` on web, which is acceptable per policy.

### 2. Rate Limiting Compliance

**Guideline**: Follow rate limiting requests (e.g., throttling notifications) received in API responses. Operators may not circumvent limits.

**Source**: [Wikimedia Foundation API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) (August 26, 2024)

**Implementation**: My rate limiter enforces limits, and my error handling includes retry logic with exponential backoff for 429 errors.

### 3. Content License Compliance

**Guideline**: Follow the requirements of content licenses when republishing downloaded or cached data.

**Source**: [Wikimedia Foundation API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) (August 26, 2024)

**Note**: See `LEGAL_CONSIDERATIONS.md` for attribution requirements.

### 4. Robot Policy Compliance

**Guideline**: Follow the robot policy if software is automatically consuming content at a large scale.

**Source**: [Wikimedia Foundation API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) (August 26, 2024)

**Current Status**: Compliant

### 5. Request Serialization

**Guideline**: Make requests in series rather than in parallel - wait for one request to finish before sending a new request.

**Source**: [Robot Policy - Best Practices](https://wikitech.wikimedia.org/wiki/Robot_policy)

**Implementation**: Enforced for non-REST API calls.

### 6. Request Optimization

**Guidelines**:

- Use the pipe character (`|`) whenever possible: `titles=PageA|PageB|PageC` instead of separate requests
- Use generators instead of making a request for each result from another request
- Use GZip compression: Set `Accept-Encoding: gzip` header to reduce bandwidth usage

**Source**: [Robot Policy - Best Practices](https://wikitech.wikimedia.org/wiki/Robot_policy)

**Current Status**:

- ✅ Using GZip compression: `Accept-Encoding: gzip, deflate` header is set on non-web platforms (browsers handle this automatically on web)
- ✅ Batching implemented: Multiple functions use batching to combine multiple requests into single API calls using pipe-separated titles

#### Batching Implementation

WikiScroll implements batching for several API functions:

**Batch Functions**:

- `fetchArticleSummaries(titles: string[])` - Batches up to 50 article titles per request using Action API's `titles` parameter with pipe separator
- `fetchArticleLinksBatch(titles: string[])` - Batches up to 50 article titles per request for fetching forward links
- `fetchArticleBacklinksBatch(titles: string[])` - Batches up to 50 article titles per request for fetching backlinks
- `fetchCategoryPages(categoryTitle: string)` - Internally batches article summary requests (up to 50 per batch) when fetching category members

**How Batching Works**:

1. **Automatic Splitting**: Large arrays are automatically split into batches of 50 items
2. **Sequential Processing**: Batches are processed sequentially to comply with rate limits
3. **Error Isolation**: If one batch fails, other batches continue processing
4. **Title Normalization**: All titles are automatically normalized and redirects are handled
5. **Pipe Separator**: Uses Wikipedia's pipe character (`|`) to combine multiple titles: `titles=PageA|PageB|PageC`

### 7. Overall Limits

**Guidelines** (assuming best practices are followed):

- Maximum concurrent requests: Fewer than 10 overall
- Average requests per second: Below 20

**Source**: [Robot Policy - Best Practices](https://wikitech.wikimedia.org/wiki/Robot_policy)

### 8. Read Requests

**Guideline**: For read requests, don't emulate a browser - don't store cookies or execute JavaScript, unless you're not crawling at high volume (>5 requests per second).

**Source**: [Robot Policy - Best Practices](https://wikitech.wikimedia.org/wiki/Robot_policy)

**Current Status**: WikiScroll does not store cookies or execute JavaScript.

### 9. CDN Optimization

**Guideline**: Always crawl the website via `/wiki/Article_name` URLs with no query parameters for CDN-cached content (faster responses).

**Source**: [Robot Policy - Best Practices](https://wikitech.wikimedia.org/wiki/Robot_policy)

## Prohibited Practices (Foundation Policy)

According to the [Wikimedia Foundation API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) (August 26, 2024), operators must NOT:

1. **Send traffic via concurrent connections** that result in degradation of service to others or endanger site stability
2. **Request data at high rates** far beyond common use cases, such as in spikes or intentionally meant to circumvent policy
3. **Spread API requests over multiple user agents** to hide excessive use by a single operator
4. **Send high traffic** from a single source or targeting a specific wiki/resource that blocks others from accessing that resource

**Source**: [Wikimedia Foundation API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) (August 26, 2024)

**Current Status**: Axios rate limiter prevents these issues by serializing requests when required and enforcing rate limits.

## Current Implementation

WikiScroll uses **two separate Axios instances** with different rate limits optimized for each API type:

### REST API Instance (`restAxiosInstance`)

**Configuration**:

- **10 requests per second** (100ms minimum interval)
- **Up to 5 concurrent requests**
- **Location**: `api/shared/restAxiosInstance.ts`

**Used for**:

- REST API (`en.wikipedia.org/api/rest_v1`) - Single article summaries, HTML, thumbnails, descriptions, random articles
- Featured Content API (`api.wikimedia.org`) - Featured content (fetched once per day)

**Note**: Single article summary requests use the REST API. For multiple articles, use `fetchArticleSummaries()` which uses the Action API with batching.

**Compliance**:

- ✅ Well under REST API's 10 req/sec limit (matches limit exactly)
- ✅ Well under REST API's <5 concurrent limit (matches limit exactly)
- ✅ Featured content and trending articles are cached and fetched once per day, so `api.wikimedia.org`'s 500/hour limit is never approached

### Action API Instance (`actionAxiosInstance`)

**Configuration**:

- **5 requests per second** (200ms minimum interval)
- **Sequential (1 at a time)** - no concurrency
- **Location**: `api/shared/actionAxiosInstance.ts`

**Used for**:

- Action API (`en.wikipedia.org/w/api.php`) - Search, links, backlinks, categories, category members, **batched article summaries**
- Commons Action API (`commons.wikimedia.org/w/api.php`) - Media file lookups
- Pageviews API (`wikimedia.org/api/rest_v1`) - Trending articles (fetched once per day, ensures serial requests)

**Batching Functions** (all use Action API with pipe-separated titles):

- `fetchArticleSummaries(titles: string[])` - Batches up to 50 article titles per request for summaries, extracts, thumbnails, and descriptions
- `fetchArticleLinksBatch(titles: string[])` - Batches up to 50 article titles per request for forward links
- `fetchArticleBacklinksBatch(titles: string[])` - Batches up to 50 article titles per request for backlinks
- `fetchCategoryPages(categoryTitle: string)` - Internally batches article summary requests (up to 50 per batch) when fetching category members

**How Batching Works**:

- Automatically splits large arrays into batches of 50 items
- Uses pipe separator (`|`) to combine titles: `titles=PageA|PageB|PageC`
- Processes batches sequentially to comply with rate limits
- Handles title normalization and redirects automatically
- Failed batches don't prevent other batches from processing

**Compliance**:

- ✅ Well under Action API's 5 req/sec limit (matches limit exactly)
- ✅ Follows Action API's sequential requirement (1 concurrent)
- ✅ Batching functions combine multiple titles into single requests (up to 50 per request)
- ✅ Complies with Robot Policy recommendation to use pipe characters for multiple titles

### Shared Features

Both instances include:

- ✅ Proper `Api-User-Agent` header with contact information
- ✅ Automatic retry logic with exponential backoff for network errors
- ✅ 429 (rate limit) error handling with `Retry-After` header support
- ✅ 5xx server error retry logic
- ✅ GZip compression support (non-web platforms)
- ✅ CORS support with `origin=*` parameter

### Overall Compliance Status

- ✅ **REST API**: 10 req/sec, <5 concurrent (matches limits exactly)
- ✅ **Action API**: 5 req/sec, sequential (matches limits exactly)
- ✅ **api.wikimedia.org**: 500/hour (featured content and trending articles fetched once per day)
- ✅ **Pageviews API**: Serial requests (uses Action API instance which is sequential)
- ✅ **Media API**: <2 concurrent (Action API instance is sequential, so 1 concurrent)
- ✅ **User-Agent Policy**: Proper `Api-User-Agent` header on all requests

## Additional Resources

- [Wikimedia Foundation API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) (Version 1.0, August 26, 2024) - **Primary official policy**
- [Wikimedia API Portal Rate Limits](https://api.wikimedia.org/wiki/Rate_limits) - Specific numerical limits
- [API Etiquette Guidelines](https://www.mediawiki.org/wiki/API:Etiquette) - Best practices
- [Robot Policy](https://wikitech.wikimedia.org/wiki/Robot_policy) - Technical guidelines for automated access
- [MediaWiki API Rate Limits](https://www.mediawiki.org/wiki/API:Ratelimit) - Action API specific limits
