# Fee Ledger module

A self-contained feature of the CanadaDigitoba CRM that tracks college fees
per student as instalment ledgers, lets recruitment partners log money they
collect, lets the registrar confirm cash, reconciles remittance batches,
accrues partner commission, and calculates refunds under Ontario Regulation
415/06.

- Backend: `server/src/modules/fees/` (models, services, controllers, validators, routes, seed)
- Frontend: `client/src/features/fees/` (mounted at `/fees/*`)
- API: everything under `/api/fees/*`

It does not modify the lead pipeline, application tracker, student portal,
or any existing model — the only existing files touched are `server/models/User.js`
(new roles + `partnerId`), `server/server.js` (router registration), `client/src/App.jsx`
(route registration), and `client/src/components/admin/AdminLayout.jsx` (sidebar entry).

## Roles

| Role | Access |
|---|---|
| `admin` | Everything a `registrar` can do, everywhere. |
| `registrar` | College finance/admissions staff. The only role that can confirm cash (mark instalments/batches cleared), submit BJO claims, record direct payments, create students/programs/partners, and approve refunds. Sees every student. |
| `partner` | A recruitment agency login, linked to one `FeePartner` via `User.partnerId`. Sees and acts only on their own students (creating/logging receipts, sending remittance batches). Cannot confirm cash. |
| `counsellor` | Read-only. Sees fee ledgers for students whose linked lead (`FeeStudent.leadId`, pointing at the existing CRM `Student`/lead-pipeline model) is assigned to them. |
| student portal | No access — `/api/fees/*` requires the staff `protect` middleware, which a portal session's cookie never satisfies. |

All four staff roles log in through the same `/admin/login` and share the
same `AdminLayout` shell as `admin`/`counsellor` — there is no separate login
for registrar/partner accounts. `registrar` and `partner` only see the
"Fees" item in the sidebar (the rest of the CRM nav is gated to
`admin`/`counsellor`).

## Statuses

Every instalment has a **stored** status (`due` | `agent` | `funder` | `cleared`)
plus a server-computed **effective** status the UI actually renders
(`server/src/modules/fees/services/effectiveStatus.js`):

- `transit` — stored `agent` status with a `batchRef` set (wired to the college, not yet confirmed).
- `overdue` — stored `due`, past its due date, not cancelled.
- otherwise, the stored status passes through unchanged.

| Effective status | Meaning | Colour |
|---|---|---|
| `due` | Not yet due. | `#D6CFC1` (grey) |
| `overdue` | Past due, nothing collected. | `#A8342A` (red) |
| `agent` | Partner reports holding the money; not yet remitted. | `#C4821F` (amber) |
| `transit` | Inside a remittance batch, wired but unconfirmed. | `#6E5F91` (purple) |
| `funder` | Claimed from BJO (ministry), awaiting deposit. | `#4B7898` (blue) |
| `cleared` | Cash confirmed in the college account. | `#2F6B47` (green) |

An instalment can also be `cancelled` (set when a student's withdrawal/refund
is approved — see below); a cancelled instalment is excluded from every sum
except the plan's original `total`.

## Business rules

All money is stored as **integer cents, CAD**. The client only formats for
display (`client/src/features/fees/format.js#formatMoney`); it never computes
a status or a sum itself — every number and status shown comes straight from
the API response.

- **`buildPlan(program, fundingType, cohortStart)`** (`services/buildPlan.js`) generates the instalment
  list for `self` (program's fact-sheet template), `bjo` (37% / 37% / remainder ministry claims), and
  `intl` (fixed $500 deposit + $1,000 before-start + 2 or 3 further instalments rounded to $5, channel `agent`).
- **`effectiveStatus`** / **`sums`** (`services/effectiveStatus.js`, `services/sums.js`) are pure, derived,
  server-side only.
- **State transitions** (`services/transitions.js`) — `logReceipt`, `confirmReceipt`, `recordDirect`,
  `submitClaim`, `createBatch`, `confirmBatch`, `approveRefund`, `createStudent` — each checks the actor's
  role (and partner ownership) and the current state, throwing a 403/409 on a violation. Confirming an
  already-confirmed instalment or batch is a 409 no-op (idempotency).
- **Commission** (`services/commission.js`) accrues only on **cleared** instalments of a partner's **`intl`**
  students — never `self` or `bjo`. `netPayable = accrued − Σ FeeRefund.clawbackCents` for that partner.
- **Refund calculator** (`services/refundCalc.js`) implements O. Reg. 415/06 for four reasons
  (`rescind` / `before` / `visa` / `after`), including the service-fee cap ($500 or 20%, whichever is
  lower), the program-midpoint zero-refund rule, and books retention. **These are simplified,
  human-readable citations for the UI — not a substitute for legal review** (see the final report / next
  steps below).
- **Action queue** (`services/alerts.js`, `GET /api/fees/alerts`) is computed on every read: mismatches →
  overdue → held-not-remitted (or "remit within N days" for a partner) → BJO claims awaiting deposit.

Every mutation writes a `FeeLedgerEvent` (audit + activity feed) and returns
the updated student/batch so the UI can refresh from one response.

## Running it

```bash
cd server
npm install
npm test          # Jest — 60 unit tests for buildPlan/effectiveStatus/sums/commission/refundCalc/transitions
npm run seed:fees # 4 programs, 7 partners, 12 demo students, dev registrar/partner logins
```

`npm run seed:fees` creates one `registrar` and one `partner`-per-partner
login (password from `SEED_FEES_PASSWORD`, default `ChangeMe123!`) unless
`SEED_FEES_CREATE_USERS=false`. **Rotate these before any non-dev use.**

No new environment variables are required — the module runs against the
existing `MONGO_URI`.
