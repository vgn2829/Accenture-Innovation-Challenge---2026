# State Audit — Pre-Fix

## Confirmed issues

1. `src/app/simulate/page.tsx` initializes `selectedScenario` to Scenario C. The result is null, but the UI presents a hero case before a user selects one.
2. Scenario-card `onClick` calls `runSimulation`, so selection and execution cannot be separated.
3. Selecting another scenario while not running does not clear the previous result until the next run.
4. Selecting a different profile does not clear the prior result, allowing a result generated under one profile to remain beside another selected profile.
5. Dataset Lab delete does not clear `upload`, `result`, or comparison state after successful deletion.
6. Control Desk correctly refreshes the selected case after adjudication and has a backend conflict response for duplicate resolution.

## Verified state invariants

- Simulator run requests carry the selected profile.
- `/api/simulate/[scenario]` passes that profile to the orchestrator and persistence layer.
- Decision Detail reads profile and policy from the API response; it does not derive them from route/UI state.
- Dataset evaluator treats uploaded rows as `USER_UPLOADED` and excludes uploaded evidence from trusted grounding.
