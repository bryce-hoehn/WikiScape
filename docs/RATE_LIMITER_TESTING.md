## Quick Test

Run the JavaScript test:

```bash
npm run test:rate-limit
```

This will:

- Test both REST API and Action API rate limiters separately
- Make 20 rapid requests to each API type
- Measure the time between requests
- Verify that requests respect their respective rate limits
- Show detailed statistics for each instance

## What the Test Checks

WikiScroll uses two separate rate limiters:

### REST API Instance (`restAxiosInstance`)

- **Limit**: 10 requests per second
- **Minimum interval**: 100ms between requests
- **Max concurrent**: 5 concurrent requests
- **Used for**: REST API, Featured Content API, Pageviews API

### Action API Instance (`actionAxiosInstance`)

- **Limit**: 5 requests per second
- **Minimum interval**: 200ms between requests
- **Sequential**: 1 request at a time (no concurrency)
- **Used for**: Action API, Commons Action API, Pageviews API

The test verifies:

1. ✅ REST API requests are spaced at least 100ms apart
2. ✅ Action API requests are spaced at least 200ms apart
3. ✅ REST API respects concurrency limit (up to 5 concurrent)
4. ✅ Action API processes requests sequentially
5. ✅ Total time is reasonable for the number of requests

## Expected Results

If rate limiting is working correctly, you should see:

```
🧪 Testing REST API Rate Limiter
Configuration: 10 requests/second = 100ms minimum interval
Max concurrent: 5

✅ REST API rate limiter is working correctly!

🧪 Testing Action API Rate Limiter
Configuration: 5 requests/second = 200ms minimum interval

✅ Action API rate limiter is working correctly!

📋 Summary:
  REST API: ✅ PASS
  Action API: ✅ PASS
```

## Manual Testing in Browser

You can also test manually using browser DevTools:

1. Open your app in a browser
2. Open DevTools → Network tab
3. Filter by "XHR" or "Fetch"
4. Trigger multiple rapid requests (e.g., search for multiple articles quickly)
5. Check the "Timing" column - REST API requests should be spaced at least 100ms apart, Action API requests at least 200ms apart
