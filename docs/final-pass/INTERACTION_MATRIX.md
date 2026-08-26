# Final Interaction Matrix

| Page | Element | Input | Expected behavior | API/backend | UI result | Test/status |
|---|---|---|---|---|---|---|
| Navbar | Reset | Click | Reset demo DB; show success or remain safe | `POST /api/demo/reset` | Success state; failure currently console-only | API/source verified; browser unverified |
| Navbar | Mobile menu | Click | Open/close navigation | None | Menu toggles | Source verified |
| Simulator | Scenario card | Click | Select and clear prior result | None | Selected card; Awaiting Trigger | 5 source attacks passed |
| Simulator | Execute | Click | Run selected scenario | `POST /api/simulate/[scenario]` | Pipeline/result | API verified |
| Simulator | Profile | Click | Change policy context and clear result | Request body on next run | Profile pill updates | 3 profile API cases passed |
| Simulator | Audit link | Click | Open persisted decision detail | `/decisions/[id]` | Case file | Source/API verified |
| Decisions | Filter/search | Input/click | Filter returned decisions | `GET /api/decisions` | List updates | Source verified |
| Decisions | Pagination | Click | Change page within bounds | `GET /api/decisions?page=` | Page updates | Source verified |
| Decision Detail | Audit toggle | Click | Show/hide canonical audit JSON | None | Panel toggles | Source verified |
| Decision Detail | Copy JSON | Click | Copy audit event | Clipboard API | Copied state | Source verified |
| Control Desk | Refresh | Click | Reload queue | `GET /api/controldesk` | Queue updates | Source verified |
| Control Desk | Case | Click | Select case | None | Workspace updates | Source verified |
| Control Desk | Add Note | Note + click | Save note without resolving | `POST /api/controldesk/[id]` | Pending case refresh | Backend/UI implemented |
| Control Desk | Adjudicate | Click | Resolve with final action | Same POST route | Feedback banner/queue refresh | Existing API tests |
| Dataset Lab | Upload | File | Profile supported dataset | `POST /api/evaluation/datasets` | Profile cards/mapping | 168-test suite |
| Dataset Lab | Mapping | Select | Change canonical mapping; invalidate result | None until run | Mapping state updates | Source verified |
| Dataset Lab | Run | Click | Evaluate selected split/profile/mode | Dataset run POST | Metrics/failures | API verified |
| Dataset Lab | Compare profiles/modes | Click | Run comparison | Same run route | Comparison cards | API/UI implemented |
| Dataset Lab | Feedback | Click | Save review-only label | Feedback POST | Success/error notice | API/UI implemented |
| Dataset Lab | Delete | Click | Delete temporary data and clear UI | Dataset DELETE | Clean page/notice | Source/test verified |
| Evaluation | Dataset Lab link | Click | Navigate to BYO surface | `/evaluation/datasets` | Page loads | Build route verified |
