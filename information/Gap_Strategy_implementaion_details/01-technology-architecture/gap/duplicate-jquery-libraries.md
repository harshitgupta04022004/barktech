# Gap: Duplicate jQuery Libraries

## Current state

Two incompatible jQuery versions may load on the same page, causing unpredictable plugin behavior.

## Evidence

`index.html` lines ~41–42:
```html
<script src="js/jquery-1.8.2.js"></script>
```
And later:
```html
<script src="js/vendor/jquery-1.12.4.min.js"></script>
```

## Impact

- Plugin conflicts
- Larger page weight
- Harder debugging

## Severity

**Medium** (active bug risk)
