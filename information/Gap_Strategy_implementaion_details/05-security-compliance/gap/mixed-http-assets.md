# Gap: Mixed HTTP and Insecure Asset References

## Current state

- Some assets and third-party configs use `http://` URLs
- WhatsApp widget used `http://www.barktechnologies.in/...` for brand image
- wget mirror exposed dependency on live domain for fonts/CSS

## Impact

- Mixed content warnings if site on HTTPS
- Broken assets when offline or domain changes

## Severity

**Medium**
