# ControlPlane.ai — Demo Day Execution Checklist

**Accenture Innovation Challenge 2026 | Prototype Evaluation**  
**Version:** 1.0 — Hardened Presentation Standard  
**Document Status:** Approved for Round 2 Jury Live Demo  

---

## 1. Pre-Demo Setup Checklist (10 Minutes Prior)

- [ ] **Clean Environment Reset:**
  Run the reset command to ensure a fresh, pristine SQLite database state:
  ```bash
  npm run demo:reset
  ```
  *(Or click **Reset Demo** in the top navigation bar).*

- [ ] **Launch Local Dev Server:**
  ```bash
  npm run dev
  ```
  Verify the server output says:
  ```text
  Ready in 250ms
  - Local: http://localhost:3000
  ```

- [ ] **Browser Configuration:**
  - Open a clean Chrome/Safari window at `http://localhost:3000`.
  - Set browser zoom to 100%.
  - Close all unrelated applications, Slack/Teams notifications, and background downloads.
  - Verify dark theme renders cleanly.

- [ ] **Pre-Flight Verification:**
  - Overview (`/`): Shows 0 total interactions, clean dashboard.
  - Simulator (`/simulate`): 4 scenario cards visible with Hero Scenario C prominently highlighted.
  - Control Desk (`/controldesk`): "Queue is clear!" empty state visible.
  - Live Decisions (`/decisions`): Clean feed.

---

## 2. Golden Demo Path Execution Protocol (2 to 3 Minutes)

Follow this exact sequence during jury presentation:

### Phase 1: Problem Statement & Introduction (30 seconds)
1. **Screen:** Overview Dashboard (`/`)
2. **Talking Point:** *"ControlPlane.ai is not an analytics dashboard or an offline evaluation tool. It is an active runtime decision layer that sits between AI models and business systems to deterministically RELEASE, EDIT, BLOCK, or ESCALATE responses based on Risk-Adaptive Verification."*
3. **Action:** Click **"Launch Demo Simulator"** in the hero banner.

---

### Phase 2: Scenario A — Low-Risk Autonomous Pass (20 seconds)
1. **Card:** Scenario A (*Standard E-Commerce Fulfillment Confirmation*)
2. **Action:** Click **"Run Scenario A"**.
3. **Observation:**
   - Stepper flashes rapidly through Step 1 → Step 2 (Tier 0).
   - Decision rendered: **RELEASE** in **<2ms**.
4. **Talking Point:** *"For clean, low-risk requests, Tier 0 pattern scans execute in sub-millisecond time and immediately release the response without costly external verification."*

---

### Phase 3: Scenario B — Deterministic PII Auto-Redaction (30 seconds)
1. **Card:** Scenario B (*Customer Contact Details Leaked in Support*)
2. **Action:** Click **"Run Scenario B"**.
3. **Observation:**
   - Tier 0 detects phone (+91 9876543210) and email -> routes to Tier 1.
   - Decision rendered: **EDIT**.
   - Side-by-side blue comparison shows `[PHONE REDACTED]` and `[EMAIL REDACTED]`.
4. **Talking Point:** *"When privacy violations occur with safe deterministic repair, ControlPlane automatically redacts sensitive data and delivers a safe response without breaking customer experience."*

---

### Phase 4: Hero Scenario C — The ₹24,500 Dispute Block (45 seconds)
1. **Card:** Scenario C (*Hero Scenario: Factual Refund Assertion Contradicting Core DB*)
2. **Action:** Click **"Run Scenario C"**.
3. **Observation:**
   - Tier 0 detects financial transaction claim -> escalates to Tier 2 Deep Grounding.
   - Tier 2 queries enterprise database: AI Claim (*₹24,500 Refund Processed*) vs. Core DB Record (*Status: REJECTED*).
   - Decision rendered: **BLOCK** with high Performance Risk (90/100).
4. **Talking Point:** *"Here is our core differentiator. The AI model hallucinated that a ₹24,500 refund was processed. Tier 2 cross-checked the enterprise ground-truth database, detected an irreconcilable factual conflict, and blocked the message before financial damage occurred."*
5. **Action:** Click **"Inspect Full Decision Audit"** to briefly show the 4-pillar audit breakdown and verification path stepper at `/decisions/[id]`.

---

### Phase 5: Scenario D & Human Control Desk (45 seconds)
1. **Navigate:** Return to `/simulate` and click **"Run Scenario D"** (*Demographic Hiring Bias*).
2. **Observation:**
   - High-impact fairness policy concern detected -> Decision: **ESCALATE**.
   - Notification prompt directs to Human Control Desk.
3. **Action:** Click **"Open Control Desk →"** (or click **Control Desk** in Navbar).
4. **Observation:**
   - Case is highlighted in the left queue.
   - Right adjudication workspace shows full context, detected policy concern, and supervisor action panel.
5. **Action:** Enter reviewer note: *"Confirmed demographic policy infraction. Re-routed to human recruitment team."* and click **"Confirm Block"**.
6. **Observation:**
   - Status badge transitions from **PENDING** to **RESOLVED**.
   - Banner confirms supervisor override recorded to audit trail.
7. **Talking Point:** *"When AI encounters ambiguity or high-liability fairness concerns, ControlPlane places a human supervisor in authoritative control."*

---

### Phase 6: Return to Overview & Wrap-up (20 seconds)
1. **Navigate:** Click **Overview** in Navbar (`/`).
2. **Observation:**
   - Total interactions updated to 4.
   - Decision breakdown shows: 1 RELEASE (25%), 1 EDIT (25%), 1 BLOCK (25%), 1 ESCALATE (25%).
   - Tier distribution reflects: 1 Tier 0, 1 Tier 1, 2 Tier 2.
   - Pending Control Desk escalations = 0.
3. **Closing Line:** *"That is ControlPlane.ai — deterministic, risk-adaptive runtime governance for enterprise AI systems."*

---

## 3. Post-Recording / Reset Protocol

To reset the application for the next demo run:
```bash
npm run demo:reset
```
Or click the **"Reset Demo"** button on the Navbar.
