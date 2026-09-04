# CanadaDigitoba

A study-abroad & immigration consultancy platform covering two verticals on
one shared CRM pipeline:

1. **PSW pathway** — Personal Support Worker recruitment/immigration (the
   original site focus).
2. **Study in Canada** — general India-focused student recruitment: programs,
   verified colleges, eligibility/cost calculators, and a full lead-to-
   enrolment CRM (Phase 1 MVP per the internal platform spec).

Four app surfaces share one backend:

- **Public marketing site** — both verticals' pages, lead-capture forms,
  eligibility/cost calculators, verified college/program browser.
- **Admin CRM** (`/admin`) — full student pipeline, college/program database
  management, counsellor management, analytics.
- **Counsellor dashboard** — the same `/admin` screens, scoped server-side to
  a counsellor's own assigned students, plus a daily follow-up task panel.
- **Student portal** (`/portal`) — a completely separate login for students
  themselves: profile, document upload, application status, payments,
  messaging with their counsellor.

Built with React (Vite) + Tailwind CSS + shadcn/ui-style components +
[Animate UI](https://animate-ui.com) + [Lenis](https://lenis.dev) on the
frontend, and Node.js/Express + MongoDB/Mongoose on the backend.

---

## 1. Prerequisites

- **Node.js 18+** and npm.
- **MongoDB** — a local instance (e.g. MongoDB Community Server as a Windows
  service on `mongodb://127.0.0.1:27017`) or a MongoDB Atlas cluster.
- (Optional) SMTP credentials for real emails — `server/.env` already has
  `SMTP_USER=digitobaca@gmail.com` filled in; you just need to generate a
  Gmail **App Password** (Google Account → Security → 2-Step Verification →
  App Passwords) and paste it into `SMTP_PASS` in your local `.env`. Without
  it, emails are logged to the server console instead of sent (fully
  functional either way — nothing breaks if you skip this).
- (Not yet wired in — see §9) WhatsApp/SMS provider credentials, a payment
  gateway (Razorpay/Stripe).

## 2. Project structure

```
Digiboa/
├── client/src/
│   ├── components/
│   │   ├── ui/            # shadcn-style primitives (button, dialog, table, tabs, ...)
│   │   ├── animate-ui/     # ported Animate UI icon engine + icons (see §11)
│   │   ├── layout/          # Header, Footer, Layout, SmoothScroll (Lenis)
│   │   ├── home/             # Hero, PSWSection, Testimonials, FAQSection, ...
│   │   ├── forms/             # ConsultationForm (shared lead-capture form)
│   │   ├── admin/              # AdminLayout, StudentsTable, StudentDetailModal,
│   │   │                       # CollegeFormModal, CounsellorTodayPanel, ProtectedRoute
│   │   └── portal/              # PortalLayout, PortalProtectedRoute
│   ├── context/            # AuthContext (staff), PortalAuthContext (students),
│   │                       # ConsultationModalContext
│   ├── lib/api.js          # every backend call, staff + portal axios instances
│   ├── data/                # faq.js, testimonials.js, blogPosts.js (static content)
│   └── pages/
│       ├── *.jsx            # public site incl. Study-in-Canada vertical pages
│       ├── admin/            # DashboardPage (students), CollegesPage, CounsellorsPage, AnalyticsPage
│       └── portal/            # PortalDashboardPage, PortalProfilePage, PortalDocumentsPage, ...
└── server/
    ├── config/db.js
    ├── models/             # User, Student, College, Program, Application,
    │                       # Document, Payment, Task, CommunicationLog
    ├── controllers/        # one per model + analyticsController + portalController
    ├── routes/             # one per model + auth.js + portal.js
    ├── middleware/         # auth.js (protect/authorize/scopeToCounsellor/protectStudent),
    │                       # upload.js (multer), errorHandler.js, rateLimiter.js, validators.js
    ├── utils/               # leadScoring.js, autoAssignCounsellor.js, messaging.js (WhatsApp/SMS
    │                        # stub), onboardNewLead.js (automation chain), sendEmail.js
    ├── uploads/              # local-disk document storage (gitignored)
    └── seed/                 # createAdmin.js, seedColleges.js
```

## 3. Setup

### 3.1 Install & configure

```bash
npm run install:all          # root + server + client
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in `server/.env` — at minimum `MONGO_URI` and `JWT_SECRET`. See the
comments in `server/.env.example` for every variable, including the
not-yet-wired WhatsApp/SMS/payment provider slots (§9).

### 3.2 Create your first admin and a counsellor

Admin accounts aren't created via a public API (security) — use the CLI:

```bash
cd server
npm run seed:admin -- "Jane Doe" jane@canadadigitoba.com "StrongPassword123!"
```

Counsellor accounts are created by an admin from the CRM UI
(`/admin/counsellors`) or via `POST /api/auth/counsellors`.

### 3.3 (Optional) Seed sample colleges/programs

```bash
npm run seed:colleges
```

Adds a handful of well-known Canadian institutions as **unverified** sample
records — review and mark `verified: true` (via the admin Colleges page)
before they're real enough to show real students. See the warning at the top
of `server/seed/seedColleges.js`.

### 3.4 Run it

```bash
npm run dev
```

Runs the API (`:5000`) and site (`:5173`) together. Visit:

- `http://localhost:5173` — public site
- `http://localhost:5173/admin/login` — staff (admin/counsellor) login
- `http://localhost:5173/portal/login` — student portal login (activate a
  student's portal access first — see §5)

## 4. The CRM pipeline & data model

One `Student` record represents a person from their very first form
submission through enrolment — the same document gains richer fields
(education history, test scores, documents, applications, notes) as a
counsellor works it, rather than separate "Lead" and "Student" collections
kept in sync (see the comment at the top of `server/models/Student.js`).

**Pipeline stages** (`Student.pipelineStage`):
`New Lead → Cold Attempt 1 → Cold Attempt 2 → Cold Attempt 3 → Warm Lead →
Hot Lead → Interested → Enrolled` (`Student.PIPELINE_STAGES`, in forward
order — used for the "how far along" index math in `analyticsController`
and `adCampaignController`), plus four side/terminal outcomes a lead can
land on from anywhere in that flow (`Student.TERMINAL_STAGES`): `Not
Interested`, `Counselled Not Enrolled`, `Hold Lead`, `BJO`.

**The end-to-end workflow**: book a consultation (public form) →
auto-assigned to a counsellor → counsellor works the case through cold
attempts to warm/hot (Contact Log) → student fills in their own profile via
the portal (auto-bumps the stage to `Warm Lead` if it's still early) → once
a college/program is chosen, an `Application` record is created from the
Applications tab (auto-bumps the student to `Interested` if it's still
behind that) and managed end to end (stage, application number, admission
details) as the college confirms. The admin who liaises with colleges is a
regular staff account here, not a separate external login.

Both admin and counsellor can move a case through any stage — there's no
handoff gate in this pipeline (that only made sense for the longer
application-tracking pipeline this replaced). `Application` records
(college applications/visas) stay admin-only to create/edit
(`routes/applications.js`), independent of the student's `pipelineStage`.

**Related collections** (each references `student`, not embedded, so
counsellor/admin dashboards can query across all students efficiently):
`Application`, `Document`, `Payment`, `Task`, `CommunicationLog`. `College`
and `Program` are independent, admin-managed, with an explicit
`verified`/`officialNotes` vs. `internalNotes` split — **nothing in that
database is AI-generated**; every fact must come from actual staff review.

**Automation** (`server/utils/onboardNewLead.js`, runs on every public form
submission): rule-based lead scoring (0-100, fully explainable — see
`leadScoring.js`) → least-loaded counsellor auto-assignment → WhatsApp +
email acknowledgement → team notification email → an auto-generated
follow-up `Task` due the next day.

**Contact-status tracking**: from a student's record (Contact Log tab), a
counsellor logs the outcome of every attempt — `Contacted`, `Not Contacted`,
or `No Response` — with notes required only when they actually reached the
student (nothing to say for a failed attempt). Every log is a
`CommunicationLog` entry, and the student's `lastContactStatus`/
`lastContactAt` are denormalized onto the `Student` record so the admin
students table can show a "Last Contact" column without an extra query per
row.

**Student chat**: a real two-way thread between a student and their assigned
counsellor, backed by the same `CommunicationLog` collection — a student's
message (`channel: 'Note'`, no `contactStatus`) at `/portal/messages` is
exactly what a counsellor sees and replies to. Two surfaces on the staff
side: a **Messages tab** on each student's record, and a top-level
**Messages** inbox (`/admin/messages`) listing every conversation with an
unread badge per row and in the nav — polled every 5-15s so replies show up
without a manual refresh. Admins see every counsellor's conversations (for
monitoring); counsellors see only their own assigned students', enforced
server-side. Opening a thread marks its unread messages read (shared
read-state across the team, not per-user — the point of admin visibility is
a shared inbox). Kept strictly separate from the internal contact-status
logs above: a counsellor's private "outcome of this call" notes never leak
into what the student sees.

## 5. Roles & auth (three separate systems)

| Who | Login | Cookie | Scope |
|---|---|---|---|
| **Admin** | `/admin/login` | `cd_token` | Everything: all students, colleges/programs CRUD, counsellor management, applications end-to-end, analytics |
| **Counsellor** | `/admin/login` | `cd_token` | Same UI as admin, server-side scoped to `assignedCounsellor === self` on every student/application/document/task query (`middleware/auth.js` → `scopeToCounsellor`) |
| **Student** | `/portal/login` | `cd_portal_token` | Only their own record — a counsellor/admin activates portal access per student (`POST /api/students/:id/activate-portal`), which generates a temp password and emails it |

Each role uses a different cookie, so an admin, a counsellor, and a student
can all be logged in simultaneously in the same browser without conflict.

Applications are admin-managed end to end (stage, application number,
admission start date, full admission details) — the same admin who liaises
with colleges on a case handles this from the **Applications** tab, no
separate external login involved. Every stage change is appended to
`Application.history` so the full paper trail from "College Selected" to
"Enrolled" lives in one place.

## 6. Attendance / shift tracking

Every staff login/logout doubles as a shift clock-in/clock-out
(`server/models/Attendance.js`):

- **Login = Shift Start.** Recorded automatically — no separate action
  needed. If a browser was closed without logging out, the next login
  *resumes* that still-open shift rather than starting a second overlapping
  one.
- **Logout = Shift End.** Clicking "Log Out" in the CRM header opens a
  dialog asking **"What did you get done today?"** before actually signing
  out. The summary is encouraged, not force-required — "Skip & Log Out" is
  always available, since a required field would be a bad time to discover
  you can't sign out. On submit, `shiftEnd` and `durationMinutes` are
  recorded alongside whatever summary was entered.
- **`/admin/attendance`** — a nested accordion: **Staff → Day → each login
  session**, with a running total (shift count + hours) at every level so
  the report reads top-down without scrolling a flat table. Admins see
  every staff member with filters by name and date range; counsellors see
  only their own history, no filters needed. Shifts still open (browser
  closed, session expired) show as an **Ongoing** badge rather than a
  fabricated end time.
- **Excel export** (admin only) — a "Download Excel" button streams an
  `.xlsx` (`exceljs`, `server/controllers/attendanceController.js`) of every
  shift matching the current filters: staff name, email, role, date,
  start/end, duration in hours, status, and the daily summary. Not scoped to
  what's on-screen/paginated — it queries the full filtered set directly.

## 7. Ads Dashboard

Admin-only (`/admin/ads`) — tracks Meta Ads, Instagram boosts, Google Ads,
SEO/organic, and anything else driving leads, modeled on a
Spend → Leads → Qualified Leads → Applications → Deposits → Enrolments
decision framework.

Deliberately split in two, so nothing is ever manually double-entered:

- **Ad-platform numbers** (spend, impressions, clicks) — entered by hand per
  `AdCampaign` (`server/models/AdCampaign.js`), the same "no live API, stub
  until a provider is configured" pattern as WhatsApp/payments elsewhere in
  this app.
- **Everything from Leads onward** — leads, qualified leads, applications,
  deposits, enrolments, and collected revenue — is **computed live** from
  real `Student`/`Payment` records attributed to that campaign
  (`adCampaignController.js`). "Qualified"/"Application"/"Deposit"/"Student
  in Canada" are literal stage names already in `Student.PIPELINE_STAGES`,
  so this falls straight out of the existing pipeline instead of a second,
  parallel tracking system that could drift out of sync.

**Attribution** — how a lead gets linked to a campaign:

- **Automatic**: add `?utm_campaign=<slug>` to an ad's landing page link,
  matching an `AdCampaign.utmSlug`. Every public lead form funnels through
  one function (`submitLead` in `client/src/lib/api.js`), which reads
  `utm_campaign` off the current URL and passes it through — the backend
  matches it against a campaign and links the new `Student` automatically
  (`studentController.createStudent`). No match, no crash — the raw string
  is kept on `Student.utmCampaign` either way, so nothing is lost if a
  campaign gets created in the dashboard after the ad already started
  running.
- **Manual**: any student's `campaign` field can be set/corrected directly.

The dashboard itself (`AdsDashboardPage.jsx`) has two tabs: **Overview**
(KPI cards, funnel health, spend/leads by channel, a leaderboard, and a
"Needs Attention" callout for campaigns that spent enough to judge but have
zero qualified leads) and **Campaigns** (full CRUD table with channel/status
filters). A lightweight **Suggested Decision** (Scale/Keep/Modify/
Stop/Review) is computed per campaign from simple, clearly-labeled
thresholds (`MIN_REVIEW_SPEND`, `TARGET_ROAS` in `adCampaignController.js`)
— a starting default, not a rule proven for your business yet, and always
separate from your own `decision` field, which is never overwritten
automatically.

## 8. API reference (selected)

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/students` | Public (rate-limited) | Create/capture a lead from any site form |
| `GET/PUT` | `/api/students/:id` | Private (scoped) | CRM record read/update — either role can set `pipelineStage` to any value in `PIPELINE_STAGES`/`TERMINAL_STAGES` |
| `DELETE` | `/api/students/:id` | Private (admin) | Delete a CRM record |
| `POST` | `/api/students/:id/notes` | Private (scoped) | Append a timestamped counsellor note |
| `POST` | `/api/students/:id/activate-portal` | Private (scoped) | Generate portal password, email the student |
| `GET/POST/PUT/DELETE` | `/api/colleges`, `/api/programs` | Public read (verified only) / Private write (admin) | The verified institution database |
| `GET` | `/api/applications` | Private (scoped) | Per-student college applications, with a full stage-change history |
| `POST/PUT/DELETE` | `/api/applications` | Private (admin) | Create/update — stage, application number, admission details, all admin-managed |
| `GET/POST/PUT` | `/api/documents` | Private (scoped) | Staff-side document upload/verification (`multipart/form-data`, field `file`) |
| `GET/POST/PUT` | `/api/payments` | Private | Payment/invoice records (no live gateway — see §9) |
| `GET/POST/PUT` | `/api/tasks` | Private | Follow-ups; `?today=true` for the dashboard's due/overdue widget |
| `GET/POST` | `/api/communications` | Private | Per-student timeline; `?type=chat` (student thread) / `?type=log` (contact-status entries) / omitted (everything). Opening `type=chat` marks that student's unread messages read |
| `GET` | `/api/communications/inbox` | Private | One row per student conversation — last message, when, unread count — for the Messages inbox. Scoped: counsellors see their own, admins see all |
| `GET` | `/api/communications/unread-count` | Private | Total unread inbound chat messages, scoped the same way — feeds the nav badge |
| `GET` | `/api/analytics/overview` | Private (admin) | Pipeline funnel, conversion %, revenue, source/counsellor/country breakdowns |
| `POST/GET` | `/api/auth/login`, `/api/auth/me`, `/api/auth/logout` | — | Staff auth (login/logout double as shift start/end) |
| `GET/POST/PUT` | `/api/auth/counsellors` | Private (admin) | Counsellor account management |
| `GET` | `/api/attendance` | Private (scoped) | Shift history; admins may pass `?user=`/`?dateFrom=`/`?dateTo=` to filter, counsellors always see only their own |
| `GET` | `/api/attendance/export` | Private (admin) | Streams the filtered shift history as `.xlsx` |
| `POST/GET` | `/api/portal/login`, `/api/portal/me`, `/api/portal/logout` | — | Student portal auth |
| `GET/PUT` | `/api/portal/profile` | Private (student) | The student's own profile |
| `GET/POST` | `/api/portal/documents` | Private (student) | Student's own document upload/list |
| `GET` | `/api/portal/applications`, `/api/portal/payments` | Private (student) | Read-only status views |
| `GET/POST` | `/api/portal/messages` | Private (student) | Message thread with their counsellor |
| `GET` | `/api/ad-campaigns`, `/api/ad-campaigns/:id` | Private (admin) | Campaigns with computed stats (leads through ROAS) |
| `GET` | `/api/ad-campaigns/overview` | Private (admin) | Cross-campaign totals, channel breakdown, funnel, leaderboard |
| `POST/PUT/DELETE` | `/api/ad-campaigns/:id` | Private (admin) | Create/update ad-platform numbers; delete unlinks (not deletes) attributed students |

## 9. What's stubbed, and how to wire it up for real

Per the setup decisions for this build, a few integrations are built with a
clean interface but no live provider yet:

- **WhatsApp/SMS** (`server/utils/messaging.js`) — every send currently logs
  to the console and writes a `CommunicationLog` entry with
  `deliveryStatus: 'logged'`. Set `WHATSAPP_PROVIDER`/`SMS_PROVIDER` in
  `server/.env` and extend `sendWhatsApp`/`sendSMS` to call the real API
  (Meta Cloud API, Twilio, Gupshup, etc.) once you have credentials — nothing
  else in the codebase needs to change.
- **Payments** (`models/Payment.js`, `controllers/paymentController.js`) —
  records are staff-created/updated manually; `gatewayProvider`/`gatewayRef`
  fields are ready for a Razorpay/Stripe webhook handler to populate.
- **Document storage** (`server/utils/storage.js`) — real, not stubbed, once
  `R2_*` is set (see `.env.example`); falls back to local disk otherwise
  (`server/uploads/`, local dev only — doesn't survive a deploy).
- **Meta/Google Ads API** (§7's Ads Dashboard) — spend, impressions, and
  clicks are entered by hand per campaign today; everything past that
  (leads through ROAS) is already live/real, computed from actual CRM
  records. Wiring the Marketing API/Google Ads API would just mean writing
  those three numbers onto `AdCampaign` automatically instead of by hand —
  nothing downstream would need to change.

## 10. Security notes

- Both staff and portal JWTs live in **HTTP-only cookies** (different cookie
  names), never `localStorage`.
- `helmet`, `express-rate-limit`, `express-mongo-sanitize` applied globally;
  public lead submission and both login routes have tighter, dedicated
  rate limits.
- All input validated with `express-validator`; enum fields (pipeline stage,
  lead source, document type, etc.) are enforced both there and at the
  Mongoose schema level.
- Passwords (staff `User.password`, student `Student.portalPassword`) are
  bcrypt-hashed (cost factor 12) and `select: false` by default.
- Document uploads are restricted by MIME type and a 10MB size cap
  (`middleware/upload.js`), parsed into memory and handed to
  `utils/storage.js`, which uploads to Cloudflare R2 when configured or
  falls back to local disk in dev — every consumer just reads/stores
  `document.fileUrl`, a URL either way, so nothing else needed to change.
- Counsellor data scoping (`scopeToCounsellor`) is enforced server-side on
  every query, not just hidden in the UI.

## 11. Design & animation stack

- **[Animate UI](https://animate-ui.com)** (MIT) — animated icons built on
  Motion. Ships as copy-paste source, so the actual upstream source for a
  curated ~15-icon set was ported (TS→JS, with an explicit `React.forwardRef`
  fix for React 18 compatibility — the upstream targets React 19) into
  [`client/src/components/animate-ui/`](client/src/components/animate-ui/).
- **[Lenis](https://lenis.dev)** (MIT, `lenis` npm package) — app-wide smooth
  scroll, wired in
  [`SmoothScroll.jsx`](client/src/components/layout/SmoothScroll.jsx).
- `Inspira UI` was evaluated but is Vue/Nuxt-only — not part of the stack.

## 12. Deployment

The stack this is actually deployed on: **Vercel** (frontend) +
**Railway** (backend) + **MongoDB Atlas** (database) + **Cloudflare R2**
(document storage), domain registered on Hostinger with its DNS pointed at
Vercel/Railway rather than moved anywhere.

- **Frontend (Vercel)**: connect the GitHub repo, set the project root to
  `client/`, framework preset "Vite". Set `VITE_API_URL` to the backend's
  Railway URL (e.g. `https://api.yourdomain.com/api` once the custom domain
  is attached, or the `*.up.railway.app` URL before that). Attach the
  Hostinger domain in Vercel's Domains tab, then add the CNAME/A records it
  gives you in Hostinger's DNS panel.
- **Backend (Railway)**: connect the same repo, set the service's root
  directory to `server/`, start command `npm start`. Set every variable
  from `server/.env.example` in Railway's Variables tab — at minimum
  `MONGO_URI` (Atlas connection string), `JWT_SECRET`, `NODE_ENV=production`,
  `CLIENT_URL` (the deployed Vercel origin, exactly — this drives both CORS
  and cross-origin cookies), and the `R2_*` document-storage variables (§9).
  Attach a subdomain (e.g. `api.yourdomain.com`) via Railway's Networking
  tab the same way.
- **Database (MongoDB Atlas)**: free M0 tier is enough to start. Create a
  database user (separate from your Atlas login) and allow-list `0.0.0.0/0`
  under Network Access (Railway's outbound IPs aren't static on the free
  plan) — use that connection string as `MONGO_URI`.
- **Document storage (Cloudflare R2)**: see §9 for setup steps. Required
  before going live — Railway's filesystem doesn't persist `server/uploads/`
  across deploys, so local-disk storage silently loses every file on the
  next deploy if R2 isn't configured.
- **Cookies across two domains**: `server/utils/generateToken.js` already
  sets `secure: true` and `sameSite: 'none'` whenever `NODE_ENV=production`
  — required for the staff/portal login cookies to work at all once the
  frontend and backend are on different origins (Vercel vs. Railway/your
  API subdomain). Nothing to change here, just don't remove it.

## 13. What's included vs. what's next

**Included** (this is a "foundation first" pass — full data model and basic
CRUD across every entity, not yet fully polished on every screen):

- Both verticals' public pages, including working (client-side, disclosed-
  assumptions) eligibility checker and cost calculator.
- The full lead-qualification CRM pipeline, shared by both verticals — 8
  forward stages plus 4 terminal outcomes, both roles managing it freely
  (see §4).
- Role-based admin CRM + counsellor dashboard (same screens, server-scoped).
- Verified college/program database with admin CRUD.
- Applications, documents (real file upload), payments, tasks, and a full
  communication timeline per student.
- A working student self-service portal with its own auth, profile,
  document upload, application/payment status, and messaging.
- Automation: lead scoring, counsellor auto-assignment, follow-up tasks,
  WhatsApp/email acknowledgements (stubbed where no provider is configured).
- Admin analytics: pipeline funnel, conversion rates, revenue, breakdowns.
- Attendance/shift tracking: automatic shift-start on login, a shift-end
  "what did you get done today" prompt on logout, and an admin-wide (or
  counsellor-own) attendance history view.
- Student chat: a real two-way thread between a student and their assigned
  counsellor, with a top-level Messages inbox (unread badges, live polling)
  for staff and full admin visibility for monitoring.
- Document review: a counsellor/admin opens each file a student uploaded
  (Documents tab on the student record) and marks it Verified or Rejected
  with a reason — closes the loop on the portal's upload/missing-documents
  checklist, which previously had no staff-facing side at all.
- Contact-status tracking: counsellors log every outreach attempt as
  Contacted / Not Contacted / No Response (with notes required only when
  Contacted), and the admin students table shows a live "Last Contact"
  status + timestamp per student without a page refresh.
- Applications are fully admin-managed end to end — stage, application
  number, admission start date, and full admission details all live on the
  same `Application` record the admin edits directly from the Applications
  tab, with every stage change appended to `Application.history`.
- Real Gmail SMTP wired for student-portal activation emails
  (`digitobaca@gmail.com`) — see §1 to finish setup with your own App
  Password.
- Ads Dashboard (§7): Meta/Instagram/Google/SEO campaign tracking with
  UTM-based auto-attribution — leads through ROAS computed live from real
  CRM records, not a second manually-kept spreadsheet.
- Document storage on Cloudflare R2 (§9/§12) — survives deploys, unlike the
  local-disk fallback it replaces.

**Natural next steps**: richer array editors in the student portal profile
(multiple education entries, full work-history) — currently scalar fields
only; a real payment gateway; a real WhatsApp/SMS provider; a live
Meta/Google Ads API sync so campaign spend/impressions/clicks stop being
hand-entered; role-based UI polish pass (the CRM screens are functional,
not yet as visually refined as the marketing site).
