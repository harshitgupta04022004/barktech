# Gap: No Backend or API Layer

## Current state

- Site is 100% static files served by HTTP server
- No server-side logic, no REST/GraphQL APIs
- Cannot persist leads, search products, or power AI chat from live data

## Evidence

- No `package.json`, no server routes in repository
- Forms use `method="POST"` with `action="index.html#"` — submissions go nowhere

## Impact

| Area | Severity |
|------|----------|
| Lead capture | Critical |
| AI agent | Blocked without API |
| Dynamic pricing/availability | Impossible |
| Admin reporting | Impossible |

## Production blocker?

**Yes**
