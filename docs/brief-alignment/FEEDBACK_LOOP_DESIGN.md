# Feedback Loop Design

```text
Decision → Control Desk action → FeedbackEvent → evaluation report
                                      ↓
                              policy candidate
                                      ↓
                             human approval required
                                      ↓
                              future policy version
```

Feedback events contain the request/decision ID, original decision, reviewer action, final decision, corrected label, reason, timestamp, profile, and policy version. They are audit records, not automatic policy updates.

The prototype exposes feedback through the Control Desk action API and a small Trust & Evaluation page. A candidate rule can be generated from repeated corrected labels, but no code or active policy is changed automatically.
