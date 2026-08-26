# Interaction Audit — Pre-Fix

| Element | Page | Backend/API | Actual result | Status |
|---|---|---|---|---|
| Reset | Navbar | `POST /api/demo/reset` | Resets SQLite only; failure is silent in UI | PARTIAL |
| Scenario cards | Simulator | `POST /api/simulate/[scenario]` | Selects and executes in one click | MISLEADING |
| Execute Simulation | Simulator | Same route | Executes selected scenario and renders result | WORKING |
| Profile pills | Simulator | Request body `profile` | Reaches orchestrator and persistence | WORKING, but stale result remains after change |
| View Full Audit Case File | Simulator | `/decisions/[id]` | Navigates to persisted case | WORKING |
| Refresh Queue | Control Desk | `GET /api/controldesk` | Reloads queue | WORKING |
| Approve / Edit / Block | Control Desk | `POST /api/controldesk/[id]` | Resolves case and creates feedback | WORKING |
| Add Note | Control Desk | Backend supports action | No UI affordance | MISSING |
| Copy JSON | Decision Detail | Browser clipboard | Copies audit event | WORKING |
| Dataset upload/run/compare | Dataset Lab | Dataset APIs | Real response rendered | WORKING |
| Dataset delete | Dataset Lab | `DELETE /api/evaluation/datasets/[id]` | Server deletion occurs; local state remains | PARTIAL |
