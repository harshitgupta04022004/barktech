# Strategy: No CI/CD, Staging, or Monitoring

## Objective

Safe releases with automated checks.

## CI/CD pipeline (GitHub Actions)

```yaml
on: [push, pull_request]
jobs:
  test:
    - npm ci && npm run lint && npm run build
    - lighthouse-ci (budget assertions)
  deploy:
    - Vercel preview on PR
    - Production on merge to main
```

## Environments

| Env | Branch | URL |
|-----|--------|-----|
| Production | `main` | barktechnologies.in |
| Staging | `develop` | staging.barktechnologies.in |
| Preview | PR | vercel-preview-*.vercel.app |

## Monitoring

- **Sentry** — front end + API errors
- **UptimeRobot** or Better Stack — ping `/api/health` every 5 min
- **GA4** — traffic + conversions

## Effort

**Medium** (2–3 days initial setup)
