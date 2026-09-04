# CanadaDigitoba CRM — User Guide

A plain-language guide to using the CRM, for counsellors and admins. This
covers what's actually built and working today — nothing here is a
"planned" feature.

---

## 1. The two roles

Everyone on the team has one of two accounts:

| | **Counsellor** | **Admin** |
|---|---|---|
| Sees | Only their own assigned students | Every student, every counsellor's work |
| Manages leads | Yes — full pipeline, contact log, documents, chat | Yes, for any student |
| Manages Applications (college applications) | View only | Create & manage |
| Counsellors page | ❌ | ✅ (create/deactivate accounts) |
| Ads Dashboard | ❌ | ✅ |
| Analytics | ❌ | ✅ |
| In a student's chat | Full participant (sends messages) | Can read any conversation, but can't send — monitoring only |

Both roles share the exact same screens for Students, Applications,
Messages, Colleges, and Attendance — what you see on each is just
automatically scoped to what you're allowed to touch.

**Logging in**: `/admin/login` — email + password given to you by an
admin. There's no self-registration; an admin creates every staff account
(see §9).

**Shift tracking**: every login starts a shift automatically. When you
click **Log Out**, you're asked for a short optional note on what you got
done — you can skip it, but it's worth the ten seconds, since it's what
shows up in Attendance (§8) for anyone reviewing the day later.

---

## 2. Where everything is (the nav bar)

- **Students** — your main workspace. Every lead/student record, the
  pipeline stage, and all the tools to work a case (see §3).
- **Applications** — college applications in progress (see §4).
- **Messages** — your inbox of student conversations (see §5).
- **Colleges** — the verified institution/program database (see §6).
- **Attendance** — shift history and login/logout times (see §7).
- **Counsellors** *(admin only)* — manage staff accounts (see §9).
- **Ads Dashboard** *(admin only)* — marketing spend/lead performance (see §10).
- **Analytics** *(admin only)* — company-wide pipeline and revenue view (see §11).

The top-right corner always shows a live Canada clock, your role badge,
and your name.

---

## 3. Students — the main CRM screen

This is a list of every lead/student. A counsellor sees only the students
assigned to them; an admin sees everyone.

**Search & filter**: search by name/email/phone, or filter by pipeline
stage using the dropdown. Click any row to open the full record.

### 3.1 The pipeline stages

Every lead moves through this pipeline (you can set a student's stage to
anything below, in any order — there's no lock between roles):

```
New Lead → Cold Attempt 1 → Cold Attempt 2 → Cold Attempt 3
        → Warm Lead → Hot Lead → Interested → Enrolled
```

Plus four outcomes a lead can land on at any point, instead of continuing
forward:

- **Not Interested**
- **Counselled Not Enrolled**
- **Hold Lead**
- **BJO**

A couple of stage changes happen automatically, as a nudge — you can
always override them:
- A student filling in their own profile through the student portal bumps
  them to **Warm Lead** if they're still early in the pipeline.
- Creating a college Application for a student (§4) bumps them to
  **Interested** if they're still behind that.

### 3.2 Opening a student record

Click a row to open the detail panel, with six tabs:

- **Overview** — country/education/program/status, their message, last
  contact status, the **Pipeline Stage** dropdown, and who they're
  assigned to (reassign here if needed).
- **Contact Log** — log every call/message attempt: pick
  Contacted/Not Contacted/No Response, and (if you actually reached them)
  jot down what you learned. This feeds the "Last Contact" column on the
  Students list and keeps a full timestamped history.
- **Documents** — review whatever the student has uploaded through their
  own portal (§12). Open each file, then mark it **Verified** or
  **Rejected** (with a reason if rejected) — this is what tells anyone
  else looking at the case whether a document has actually been checked.
- **Messages** — a real two-way chat with the student (see §5.1 — same
  inbox, opened from inside the record instead of the Messages page).
- **Notes** — free-text, timestamped notes, newest first. Good for
  anything that doesn't fit a structured field.
- **Portal** — shows whether the student's self-service portal login is
  active. If not, click **Activate Portal** — this generates a temporary
  password and emails it to the student along with the login link
  (`/portal/login`). They can change the password after logging in.

---

## 4. Applications

Once a student has picked a college/program, an **Application** record
tracks that specific application from start to admission:

`College Selected → Documents Ready → Submitted → Application Number
Received → Offer / Refusal → Deposit Paid → LOA Received → Visa Filed →
Visa Approved → Enrolled`

**Creating and managing an Application is admin-only.** A counsellor sees
a read-only list here to track progress on their own students' cases —
this is intentional so college-facing admission details stay in one set
of hands.

Each Application keeps a full history of every stage change (who changed
it, when).

---

## 5. Messages

### 5.1 The inbox

One row per student conversation, newest activity first, with an unread
count badge. A counsellor sees only their own students' conversations; an
admin sees every conversation site-wide (with the assigned counsellor
shown on each row) — **but an admin cannot send a message**, only read.
This is deliberate: the admin's role here is oversight, not a second
person in the same chat.

Opening a conversation marks it as read automatically.

### 5.2 What the student sees

A student's side of this exact same conversation is their own
`/portal/messages` page (§12) — it's one shared thread, not two separate
systems kept in sync.

---

## 6. Colleges & Programs

The verified institution database — every college has a list of programs
(tuition, intake months, requirements). Anyone can browse it; only an
admin can add/edit entries.

Every record has a `verified` flag. **Nothing in this database should be
treated as fact until it's been marked verified by actual staff research**
— tuition and admission details here are never AI-generated or guessed.

---

## 7. Attendance

Shows shift history: who logged in, when, for how long, and their
end-of-shift note if they left one.

- A counsellor only ever sees their own shifts.
- An admin sees everyone, grouped by staff member → by day → by individual
  login session, with name and date-range filters, plus a
  **Download Excel** button for a full exportable report.

---

## 8. Counsellors *(admin only)*

Create new counsellor accounts (name, email, phone, password), see each
one's current caseload (how many active students they're carrying), and
deactivate an account if someone leaves — deactivating doesn't delete
their history, it just blocks login.

---

## 9. Ads Dashboard *(admin only)*

Tracks ad campaigns (Meta, Instagram boosts, Google, SEO, and anything
else) against real leads pulled live from the CRM — nothing here is
manually re-entered:

- **Overview tab**: total spend, revenue, ROAS, leads, qualified leads
  (reached Warm Lead or further), interested leads, enrolments, cost per
  lead/qualified lead/enrolment, a funnel chart, spend & leads by channel,
  your top-performing campaigns, and a "Needs Attention" list (spent
  enough to judge, zero qualified leads yet).
- **Campaigns tab**: every campaign with its own stats, filterable by
  channel/status, with a suggested decision (Scale / Keep / Modify / Stop)
  computed from spend vs. ROAS vs. qualified-lead count.

**How a lead gets attributed to a campaign**: every campaign has a
`utm_campaign` slug. Any lead that arrives through a link carrying that
slug (`?utm_campaign=your-slug`) is automatically matched to that
campaign — no manual tagging needed.

---

## 10. Analytics *(admin only)*

Company-wide numbers: conversion rates between pipeline stages (Lead →
Warm, Warm → Interested, Interested → Enrolled), the full funnel, the
outcome breakdown (Not Interested / Counselled Not Enrolled / Hold Lead /
BJO counts), leads by source and by country, revenue by currency, and
each counsellor's current caseload.

---

## 11. The student portal (what your students see)

Students have their own separate login at `/portal/login` (only active
once you've activated it from their Documents/Portal tab — §3.2). It's a
completely different login system from staff accounts, so a student and
staff session never collide in the same browser. From there they can:

- See their current pipeline stage and assigned counsellor.
- Fill in and update their own profile.
- Upload documents (which you then review and verify/reject — §3.2).
- See a read-only view of their Application status.
- See their payment history.
- Chat with their counsellor (the same thread as §5).
- Once they reach **Enrolled**, a pre-departure checklist appears
  (confirming their LOA, study permit, flights, GIC/proof of funds,
  insurance, and orientation).

---

## 12. A typical day, by role

**Counsellor**:
1. Log in (shift starts automatically).
2. Check **Students**, filter to your fresher stages (New Lead, Cold
   Attempt 1/2/3) — work down the list.
3. For each: log the contact attempt, update notes, move the stage
   forward (or mark Not Interested / Hold Lead if that's where it lands).
4. Check **Messages** for anything students have sent since your last
   login.
5. Review any newly uploaded documents.
6. Log out at the end of the day — leave a quick shift note.

**Admin**:
- Everything a counsellor does, for any student.
- Create Applications once a student is ready to actually apply, and
  manage them through to admission.
- Onboard new counsellors (§8).
- Check **Ads Dashboard** and **Analytics** periodically to see what's
  actually converting and where to put more budget.
- Use **Messages**' read-only view to spot-check conversations without
  getting in a counsellor's way.
- Pull an **Attendance** export when needed.

---

## 13. Where leads come from (context, not something you manage day-to-day)

Every public form on the website (the auto-popup, Contact page, Free
Assessment page, footer newsletter signup) feeds into the same Students
list automatically. The moment someone submits:

1. They're scored (0–100, based on their profile) and auto-assigned to
   the least-loaded active counsellor.
2. They get an automatic WhatsApp + email acknowledgement.
3. The team gets a notification email, and the assigned counsellor gets
   their own heads-up email.
4. A follow-up task is created for their counsellor, due the next
   business day.

You'll see the result of all that the moment you open Students — a fully
formed "New Lead" already assigned to someone, ready to work.
