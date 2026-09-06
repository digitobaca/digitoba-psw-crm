# Fee Ledger — Admin Testing Walkthrough

A step-by-step guide to actually exercise every feature of the Fee Ledger
module against the real demo data already seeded in production. Follow it
in order — each step sets up the data the next step needs.

## 1. Getting in

- URL: **`https://digitoba-psw-crm.digitobaca.workers.dev/fees`** (or your
  custom domain once that's live).
- It's **admin-only** and **not linked from the main sidebar** — you have
  to go to that URL directly while logged in as an admin. This is
  deliberate (see `docs/fees-module.md`), not a bug.
- Once there, a second row of tabs appears: **Students · Partners ·
  Remittances · Commission · Refunds · Programs**. A right-hand rail
  (**Action queue** + **Shared ledger feed**) is visible on wide screens
  on every one of these pages.

## 2. What's already sitting in the demo data

- **4 programs**: PSW (NACC Personal Support Worker), Food Service Worker,
  Medical Office Assistant, Computerized Accounting/Tax/Payroll.
- **7 recruitment partners**, three tiers (12% / 15% / 18% commission).
- **12 demo students**, deliberately set up in different states so you
  can test specific things immediately without creating everything from
  scratch:

| Student | Program | Funding | Current state — what it's good for testing |
|---|---|---|---|
| Fatima Al-Farsi | Food Service Worker | International (Gulf Access) | Every instalment still `due` — a clean student to run a full **Log receipt → Confirm receipt** cycle on. |
| Grace Dela Cruz | Food Service Worker | International (Pacific Bridge) | One instalment already `held by agent` (reported, unconfirmed) — use this one to test **Send remittance → Confirm batch**. |
| Chioma Okafor | Medical Office Assistant | International (Sahel) | Has a **deliberate mismatch** — partner reported $3,560, invoiced $3,900. Use this to see mismatch handling. |
| Simran Kaur | Accounting/Tax/Payroll | International (Northstar) | Has an **overdue** instalment. |
| Bikash Thapa | PSW | International (Himalaya) | Shows as `in transit` (already flagged as sent in a batch) — note: no matching batch record exists for this one in Remittances (a seed-data quirk, not a bug you need to fix) — use **Grace Dela Cruz** instead for the real batch-creation test. |
| Amanpreet Singh / Larissa Souza | PSW / MOA | International | First two instalments already `cleared` — good baseline "partly paid" examples, and good candidates for the **Refund calculator**. |
| Michael Chen | PSW | Self-funding | First two instalments cleared — good for **Refund calculator** or **Record direct payment** on what's left. |
| Olivia Martin | Food Service Worker | Self-funding | Has an overdue instalment. |
| Daniel Osei | Accounting/Tax/Payroll | Self-funding | Everything still `due` — clean student for a full **Record direct payment** walkthrough. |
| Priya Nair | Medical Office Assistant | BJO (government) | Claim 1 already submitted (`funder` status, awaiting ministry deposit) — use this to test **Confirm receipt** on a BJO claim. |
| Jason Wong | Food Service Worker | BJO (government) | Everything still `due` — clean student for a full **Submit BJO claim → Confirm receipt** walkthrough. |

No refunds have been approved yet, and no remittance batch actually
exists yet (Bikash Thapa's "in transit" flag is orphaned seed data) — so
the Remittances and Refunds pages will start empty. That's expected.

## 3. The full walkthrough

### A. Students list (`/fees/students`)
Land here by default. Take in the layout first:
- **Summary tiles**: total invoiced, in the college's bank account, held
  by agents, claimed from BJO, outstanding from students.
- **Stacked funnel bar**: cleared (green) / held by agent (amber) / in
  transit (purple) / claimed from BJO (blue) / not yet due (grey) /
  overdue (red).
- **Filter dropdown**: All · New applications · Held by agent · BJO ·
  Overdue · Direct payers — try a few, the table and search box both
  update live.
- Each row shows a **mini segment bar** per student (hover a segment for
  label/amount/due date/status) — click any row to open that student's
  ledger.

### B. Add a brand-new student
1. Click **Add student** (top of the Students page).
2. Fill in: full name, pick a **Program**, pick **who pays** (funding
   type — the hint text explains each), pick a **recruiting partner**
   (only shown/required for International), and a **cohort start date**.
3. Watch the **Generated instalment plan** preview update live as you
   change these — this is computed by the same `buildPlan` logic that's
   unit-tested, so the amounts/dates you see are exactly what gets saved.
4. Click **Create student & fee plan**. You land back on the Students
   list with your new student showing, all instalments `due`.

### C. Log a receipt → Confirm it (clean cycle)
Use **Fatima Al-Farsi** (or your new student from step B).
1. Open her ledger (click her row).
2. Find her first `due` instalment → click **Log receipt**.
3. Enter the amount (it's prefilled with the invoiced amount — leave it
   as-is this time) and today's date → submit.
4. That instalment now shows status **held by agent**, with a **Confirm
   receipt** button.
5. Click **Confirm receipt** → it flips to **cleared**, gets a receipt
   reference, and the student's "In college bank account" total goes up.
6. Check the **right rail**: a new entry should appear in the **Shared
   ledger feed** (tag `CONFIRMED`), and if it was in the Action queue
   before, it should now be gone from there.

### D. See a mismatch handled
Open **Chioma Okafor**'s ledger.
1. Her mismatched instalment shows a **red** "Confirm receipt" button
   (not the default color) with a note stating the reported amount
   ($3,560) differs from the invoiced amount ($3,900).
2. Click it anyway → confirming **accepts the reported amount**, not the
   originally invoiced one — that's the intended behavior (the college
   trusts what actually arrived, not what was expected).
3. Check the **Action queue** in the right rail before you do this — the
   mismatch should be listed there as something needing attention, and
   disappear from the queue once confirmed.

### E. Record a direct payment (self-funding)
Open **Daniel Osei**'s ledger (self-funding, everything still due).
1. His instalments have channel "direct" (pays the college himself,
   no agent involved) — click **Record direct payment** on the first one.
2. Enter an amount and date → submit. It goes straight to **cleared**
   (no separate confirm step — a direct payment is confirmed the moment
   it's recorded, since there's no agent in the middle to trust).

### F. Submit and confirm a BJO (government) claim
Open **Jason Wong**'s ledger (BJO, everything due).
1. Click **Submit BJO claim** on his first instalment → status becomes
   **claimed from BJO**.
2. Now click **Confirm receipt** on it (same button used for agent
   receipts) → this represents the ministry's deposit actually landing →
   status becomes **cleared**.
3. Compare with **Priya Nair**, who already has claim 1 submitted — you
   can confirm hers directly without the submit step, to see the
   "ministry deposit" wording in the receipt reference.

### G. Create and confirm a remittance batch
This is the one flow that needs fresh setup, since the seed data's
"in transit" example (Bikash Thapa) has no real batch behind it.
1. Open **Grace Dela Cruz**'s ledger — she has one instalment already
   `held by agent` (logged but not yet confirmed).
2. Go to **Remittances** (`/fees/remittances`) → click **Send
   remittance**.
3. In the modal: pick her partner (Pacific Bridge Migration), multi-select
   her held instalment, enter a wire reference (anything, e.g.
   `TEST-WIRE-001`) and today's date → the modal shows the total → submit.
4. Her instalment now shows **in transit** on her ledger, with "Go to
   Remittances" instead of a confirm button (only a registrar/admin
   confirms batches, not from the student page directly).
5. Back on **Remittances**, your new batch appears with status
   **pending** → click **Confirm batch**.
6. This clears **every instalment in the batch at once** — check Grace's
   ledger again, it should now show cleared.

### H. Check Commission
Go to **Commission** (`/fees/commission`) after doing steps C–G.
- Pacific Bridge Migration's row should now show real **commission
  accrued** (their rate × the instalment(s) you just cleared for their
  student).
- Confirm a self-funding or BJO student's cleared instalment does **not**
  show up as commission anywhere — commission only ever accrues on
  cleared `intl` instalments, by design.

### I. Refund calculator
Go to **Refunds** (`/fees/refunds`).
1. Any student with cleared instalments shows in the "Students with fees
   held" table (e.g. **Michael Chen**, **Amanpreet Singh**, or whoever
   you cleared in steps C–H) → click **Refund calculator**.
2. Pick a **reason** (each shows the actual Ontario Reg. 415/06 citation
   as a hint) — try `after` (withdrew after the program began) with a
   training-hours-delivered value under 50% of the program's total hours,
   and try it again over 50% to see the **refund drop to $0** (the
   past-midpoint rule).
3. Toggle "books returned" if the program has a Books fee line — watch
   the deduction appear/disappear live in the breakdown.
4. Click **Approve refund** → it disappears from the top table and
   appears in the **Refund log** below, with its due-by date and any
   partner clawback.

### J. Programs & Partners (read-only browsing)
- **Programs** (`/fees/programs`): click into any program to see its full
  fee-line breakdown, self-funding instalment plan, and fact-sheet
  details (NOC code, TEER, Express Entry eligibility, placement hours,
  admission requirements, schedule, bonus, BJO note).
- **Partners** (`/fees/partners`): click into any partner to see their
  full student list, held/cleared/commission totals, and tier note.

### K. Watch the right rail throughout
Keep an eye on **Action queue** and **Shared ledger feed** (now scrollable
independently, capped height, sticky in place) as you do all of the
above — every mutation you make should show up there within ~15 seconds
(they poll on that interval), which is a good sanity check that the
backend event-logging (`FeeLedgerEvent`) is actually firing on every
action, not just the ones you're directly looking at.

## 4. What you're *not* testing here (by design)

- **Registrar/partner logins** — the module is currently hard-locked to
  admin-only (both server- and client-side), so there's nothing to log
  into as those roles right now. The underlying role logic is fully
  built and unit-tested; it's just switched off. Say the word if you want
  it opened back up for specific roles.
- **Counsellor read-only access** — same reason, currently unreachable.

If anything in this walkthrough doesn't match what you actually see,
that's a real bug report — tell me exactly which step and what happened
instead.
