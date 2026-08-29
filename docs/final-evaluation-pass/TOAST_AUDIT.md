# Toast System Audit

## Requirements
1. **Placement**: Fixed top-right stack (`z-index: 9999`, responsive, `pointer-events-none` container, `pointer-events-auto` on individual toasts).
2. **Semantics**:
   - `success` (Green): For successful execution of operations (e.g. `Case approved for release.`, `Case blocked and recorded.`, `Note added to case.`). Notice that confirming a block is an operational SUCCESS, styled in green, even though the case decision is BLOCK.
   - `error` (Red): For failed operations, 400/404/409/500 HTTP responses, network failures (e.g. `Case has already been resolved.`, `Failed to save note`).
   - `warning` (Orange): For non-fatal alerts or policy cautions.
   - `info` (Blue): Informational updates.
3. **Accessibility**:
   - Live region: `aria-live="assertive"` for errors (`role="alert"`), `aria-live="polite"` for others (`role="status"`).
   - Dismiss button with visible keyboard focus.
   - Auto-dismiss after 4s (success) or 6s (error/warning).
