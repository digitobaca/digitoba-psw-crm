# Counsellor's Guide to the CanadaDigitoba CRM

Everything a counsellor actually does in this CRM, in the order you'd
realistically do it. If something you see doesn't match this guide,
that's worth flagging — not something to just work around.

## 1. Logging in

Go to `/admin/login` and sign in with the email/password your admin gave
you. There's no self-signup — every counsellor account is created by an
admin (see §9 for what that means for you).

**Your shift starts automatically the moment you log in.** You'll see a
green "Shift started [time]" pill in the sidebar the whole time you're
logged in. When you click **Log Out**, you're asked for a short note on
what you got done — it's optional (Skip & Log Out always works), but
it's worth the ten seconds since it's what your admin sees later in
Attendance.

## 2. What you'll see

A left sidebar with: **Students, Applications, Messages, Colleges,
Attendance** — that's your whole nav. (**Counsellors, Ads Dashboard,
Analytics** exist too, but only admins see them — see §9 for why.) Your
sidebar's accent color is your brand red, distinct from the admin's
indigo, so it's always obvious which mode you're in.

**Everywhere in this CRM, you only ever see your own assigned students.**
Every list, every count, every filter is already scoped to you
server-side — you're not missing anything by not seeing "all students,"
that view genuinely doesn't apply to your role.

## 3. Your Students dashboard (`/admin`)

This is home base. At the top: a **Today panel** — every follow-up task
due or overdue for you, with a one-click **mark done** once you've
actually made the call/sent the message. Below that: your full student
list, searchable by name/email/phone, filterable by pipeline stage.

A small amber badge on "Students" in the sidebar shows how many of your
leads are still brand-new (**New Lead** stage) and haven't been touched
yet — that's your priority queue for the day.

Click any row to open the full record.

## 4. Working a student record

Opening a student shows six tabs:

### Overview
Country, education, program, immigration status, their original message,
last contact status, and the **Pipeline Stage** dropdown (see §5).
**Assigned Counsellor shows as read-only text for you** — reassigning a
case to someone else is an admin decision, not something you set
yourself. (This used to be editable and caused real bugs — a case
reassigning itself out of your own view mid-edit — so it's locked down
now, deliberately.)

### Contact Log
Every time you reach out, log it here: pick **Contacted / Not Contacted
/ No Response**, and if you actually reached them, jot down what you
learned. This is what feeds the "Last Contact" column back on your
Students list, and builds a full timestamped history anyone reviewing
the case later can read — including you, three weeks from now, when you
don't remember what was said.

### Documents
Whatever the student has uploaded through their own portal shows up
here. Open each file, then mark it **Verified** or **Rejected** (with a
reason if you reject it) — this is how anyone else looking at the case
knows a document's actually been checked, not just sitting there
unopened.

### Messages
A real two-way chat with the student — the exact same thread they see on
their own portal. Only appears once their portal is activated (§6). An
admin can read this conversation too (for oversight) but can't send into
it — it's just you and the student.

### Notes
Free-text, timestamped, newest first. Anything that doesn't fit a
structured field goes here.

### Portal
Shows whether their self-service portal login is active yet — see §6.

## 5. The pipeline stages — what to actually do with them

Every lead moves through:

```
New Lead → Cold Attempt 1 → Cold Attempt 2 → Cold Attempt 3
        → Warm Lead → Hot Lead → Interested → Enrolled
```

Practical guidance for each:
- **New Lead** — hasn't been contacted yet. This is your queue.
- **Cold Attempt 1/2/3** — you've tried reaching them and haven't
  connected yet. Log each attempt in the Contact Log regardless of
  outcome — a "No Response" is still worth recording.
- **Warm Lead** — you've actually spoken to them, or they've engaged on
  their own (filling in their portal profile auto-bumps them here for
  you — a decent nudge, not something you need to do manually every
  time).
- **Hot Lead** — genuinely engaged, asking real questions, moving toward
  a decision.
- **Interested** — ready to actually apply. Once you're here, flag it for
  your admin so they can start the Application (§7) — that part's on
  them, not you.
- **Enrolled** — done. The student's portal shows a pre-departure
  checklist automatically once they hit this stage.

Or, at any point, one of four side outcomes instead of continuing
forward:
- **Not Interested** — a clean dead end.
- **Counselled Not Enrolled** — you did the work, they ultimately didn't
  enroll.
- **Hold Lead** — paused, not dead — e.g. they asked you to check back
  in a few months.
- **BJO** — a valid terminal stage; check with your admin on the exact
  convention for when to use it if that's not already clear to you —
  that's a team-workflow decision, not something the software defines.

You can move a case to **any** of these at any time — there's no
approval step, no admin gate. Move it when it's actually true, not when
you're "supposed to."

## 6. Activating a student's portal

Once a student's worth staying in touch with directly, open their
**Portal** tab and click **Activate Portal**. This generates a temporary
password and emails it to them with a login link. From their own
`/portal/login`, they can then see their status, fill in their profile,
upload documents, see their application/payment status, and chat with
you (§4).

## 7. Applications

You'll see every application for your own students on the **Applications**
tab — but it's **read-only** for you. Creating and progressing an
application (college selected → submitted → offer → visa → enrolled) is
admin-only, on purpose: the admin is the one actually liaising with
colleges, so admission-facing details stay in one set of hands. Your job
is getting a lead to **Interested** and flagging it — the admin takes it
from there.

## 8. Colleges & Attendance

- **Colleges**: browse the verified institution/program database
  (tuition, intakes, requirements) — read access for everyone, only an
  admin edits it. Anything **not** marked verified shouldn't be treated
  as fact yet — it means a real person hasn't confirmed it.
- **Attendance**: your own shift history — login/logout times, duration,
  and whatever note you left. You only ever see your own; an admin sees
  everyone's with an export.

## 9. What's admin-only, and why that's not a limitation on you

- **Counsellors page** — creating/deactivating staff accounts.
- **Ads Dashboard / Analytics** — company-wide marketing spend and
  pipeline numbers, not scoped to any one counsellor.
- **Reassigning a case's counsellor** — a lead-routing decision, kept
  with the admin.
- **Creating/managing Applications** — see §7.

None of this is about trust — it's about keeping the parts of the system
that affect *other people's* work (routing, reporting, college-facing
commitments) in one place, while everything about *your own* caseload is
fully yours to run.

## 10. A realistic day

1. Log in (shift starts automatically).
2. Check the **Today panel** — clear anything overdue first.
3. Work down your **New Lead** queue — log every contact attempt, move
   the stage forward or to a side outcome honestly.
4. Check **Messages** for anything students sent since you were last in.
5. Review any documents your students uploaded since last time.
6. Activate portal access for anyone new who's earned it.
7. Anyone who hit **Interested**? Make sure your admin knows.
8. Log out — leave a real shift note, even a one-liner. It's the only
   record of your day that isn't buried in individual student records.
