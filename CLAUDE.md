@AGENTS.md

# Claude Code Project Instructions

## Project Context

This project is the Juggernauts Athlete ID platform for Juggernauts Sporting Foundation (JSF).

The product helps grassroots athletes in Odisha create digital Athlete IDs, get reviewed and verified, register for events, participate in JSF camps, and build a structured sports profile.

The product name should remain:

**Juggernauts Athlete ID**

The parent organisation is:

**Juggernauts Sporting Foundation (JSF)**

Use JSF as the organisation/trust layer and Juggernauts Athlete ID as the product/platform name.

---

## Core Product Rules

1. Public athlete profile visibility is controlled by:
   - `profile_status = approved`
   - `is_public = true`

2. Verification is separate from public profile approval:
   - `verification_status = self_registered`
   - `verification_status = community_verified`
   - `verification_status = event_verified`

3. Camp verification is also separate:
   - Camp verification should not automatically publish a profile.

4. Public pages must never expose:
   - phone
   - email
   - exact date of birth
   - guardian details
   - private notes
   - rejection reason
   - certificate/private document URLs
   - internal coach notes

5. JSF recommendations must use careful language:
   - Use: "Recommended for further evaluation"
   - Do not use: "Guaranteed selection"

---

## Development Workflow

Always work in a feature branch. Do not commit directly to `main`.

Recommended branch naming:

```text
feature/<short-feature-name>
fix/<short-bug-name>
chore/<short-task-name>
```

Before starting work:

```bash
git status
git checkout -b feature/<feature-name>
```

Reuse existing project patterns for:

- layouts
- Supabase utilities
- auth handling
- role checks
- admin navigation
- mobile responsiveness
- Tailwind styling
- JSF branding

Do not create duplicate auth, database, or layout helpers if an existing pattern already exists.

---

## Commit Strategy

Create logical commits instead of one large commit. Each commit should be focused and understandable.

Good examples:

```text
feat(camps): add football camp verified schema
feat(scoring): add football camp scoring utilities
feat(admin): add camp management pages
feat(profile): show camp verified badge on public profiles
docs(camps): add camp verified model documentation
chore(camps): run QA and polish camp workflow
```

Commit guidelines:

- Check `git diff` before each commit.
- Avoid committing unrelated formatting changes.
- Do not commit secrets.
- Do not commit `.env` files.
- Do not commit Supabase keys.
- Do not commit Razorpay keys.
- Do not commit `node_modules`, `.next`, `dist`, or local build folders unless the project explicitly expects them.
- Keep commit messages descriptive.

---

## Pull Request Draft Requirement

After each major feature/module, create a manual PR draft file:

```text
PULL_REQUEST_DRAFT.md
```

Do not open an actual PR unless explicitly asked. The PR draft should include:

```md
# PR Title

feat: <short feature summary>

## Summary

Briefly explain what this PR adds.

## Why

Explain the product/business reason.

## Key Features

- Feature 1
- Feature 2
- Feature 3

## Database Changes

List migrations, new tables, new columns, and important constraints.

## Routes Added or Updated

List all new/changed routes.

## Privacy and Safety

Explain any public/private data handling.

## Testing Performed

List commands and manual checks.

## Screenshots to Attach

List pages/screens that should be screenshotted manually.

## Known Limitations

List what is not included.

## Follow-up Work

List future modules or improvements.
```

---

## Quality Checks

Before finalising any module, run available checks:

```bash
npm run lint
npm run build
npm run typecheck
```

If a command does not exist, mention it in the final summary.
If a command fails and cannot be fixed safely, document:

- command run
- error summary
- reason it was not fixed
- recommended next step

---

## Documentation Requirements

For meaningful features, update documentation. Possible files:

```text
README.md
TESTING.md
DEMO.md
DEMO_DATA.md
CAMP_VERIFIED_MODEL.md
PULL_REQUEST_DRAFT.md
```

Documentation should include:

- setup steps
- env variables
- Supabase migration steps
- seed data instructions
- test users/roles
- manual QA checklist
- known limitations
- future TODOs

---

## UI and Branding Rules

Use JSF purple branding consistently.

Brand palette:

```text
Primary Purple:   #5B21B6
Deep Purple:      #3B0764
Accent Purple:    #7C3AED
Lavender:         #F3E8FF
Light Background: #F8FAFC
Dark Text:        #111827
Muted Text:       #6B7280
```

Use:

- Dark JSF logo (`/public/brand/jsf-logo-dark.png`) on light backgrounds.
- Light JSF logo (`/public/brand/jsf-logo-light.png`) on dark/purple backgrounds.
- Use the `BrandLogo` component (`components/brand/BrandLogo.tsx`) — do not inline logo markup.
- Product name: `Juggernauts Athlete ID`
- Organisation name: `Juggernauts Sporting Foundation (JSF)`

Avoid inconsistent terms:

- Juggernauts Sports
- Juggernaut Sporting Foundation
- Juggernauts Foundation

---

## Responsiveness Rules

All pages must work on:

- 360px mobile
- 390px mobile
- 430px large mobile
- 768px tablet
- 1024px small laptop
- desktop

For admin tables:

- Use tables on desktop.
- Use stacked cards on mobile.
- Avoid page-level horizontal overflow.
- Long athlete IDs, names, venues, and event titles must wrap safely.

---

## Security and Privacy Rules

Do not expose private athlete data on public routes. Be careful with:

- minors
- guardian consent
- phone numbers
- email addresses
- certificates
- private notes
- coach assessments
- rejection reasons

Use public-safe views or carefully filtered queries where appropriate.

The Supabase service role key bypasses all RLS — never commit it. Store only in `.env.local` (gitignored) or Vercel environment variables.

---

## Supabase Migration Rules

- All schema changes go in numbered migration files: `supabase/migrations/NNN_description.sql`
- Never modify a migration that has already been applied to production. Add a new migration instead.
- Seed/demo data goes in `supabase/seed-demo-data.sql` — keep it idempotent (safe to re-run).
- When adding seed data with hardcoded IDs, also update `athlete_id_sequences` to avoid collision with real registrations.
- New migrations must be listed in the README quick-start steps.

---

## Final Response Required After Each Task

At the end of each task, provide:

1. Branch name used
2. Commit list with commit hashes if available
3. Files changed summary
4. Database migrations added
5. Routes added or updated
6. Tests/checks run and results
7. Known issues
8. PR draft file path
9. Manual steps required before merging

---

## Prompt Files

For larger modules, add a prompt spec file under `/prompts/`:

```text
/prompts/football-camp-verified-module.md
/prompts/athletics-camp-module.md
/prompts/hockey-camp-module.md
/prompts/pr-template.md
```

Invoke with:

```text
Please implement the module described in /prompts/football-camp-verified-module.md
and follow CLAUDE.md project instructions.
```

Recommended project structure:

```text
CLAUDE.md
/prompts/
  football-camp-verified-module.md
  pr-template.md
/docs/
  CAMP_VERIFIED_MODEL.md
  TESTING.md
  DEMO.md
PULL_REQUEST_DRAFT.md
```
