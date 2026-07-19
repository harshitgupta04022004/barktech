# Gap: Cosmetic Search With No Product Index

## Current state

Header search UI exists but does not query any product database or even client-side index.

## Evidence

```html
<form action="index.html#">
  <input type="text" placeholder="Search...">
</form>
```

No search results page, no JavaScript search handler in `main.js`.

## Impact

- Users expect search on B2B catalogs (BOBST has "Find a machine")
- Missed conversion when buyers know model names (e.g. MY-1500A)

## Severity

**Medium**
