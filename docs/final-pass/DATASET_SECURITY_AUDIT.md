# Dataset Security Audit — Pre-Fix

## Findings

- Upload, run, feedback, metadata, and delete routes require `DEMO_MODE=true` plus the server-only `DATASET_DEMO_TOKEN`, supplied by header for scripts or an HTTP-only cookie for the browser UI.
- Storage is bounded in-memory: 10 datasets, 30-minute TTL, 2MB file limit, 5,000 rows. This is acceptable only for a local prototype, but it is restart-fragile.
- Raw rows remain in process memory and are excluded from historical result artifacts.
- Uploaded evidence and entity references are not passed to the trusted evidence resolver.
- JSON nesting, malformed rows, unsupported extensions, oversized files, and ambiguous mapping have explicit handling.
- No explicit empty-file validation exists; an empty upload can be profiled and then fails later on missing response mapping.
- Invalid UTF-8 is not independently validated because `File.text()` replaces malformed sequences.

## Final boundary

The bounded local demo boundary is implemented. The token is never read by client JavaScript. Keep the current bounded in-memory storage and document its prototype-only scope.
