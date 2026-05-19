# Multi-locale Resume — Implementation Plan

Per [ADR-0004](./adr/0004-multi-locale-resume.md). Eight slices, sequential by default.

## How to use this plan

For each slice:

1. Open a fresh Claude Code session in this repo.
2. Copy the prompt block under the slice and paste it as your first message.
3. Work through the slice. Sub-tasks can be ticked off as you go.
4. Commit + push using the suggested commit subject.
5. Tick the slice's top-level checkbox here and move on.

## Parallelism

Slices 1 and 2 are strictly sequential. After Slice 2 lands, the dependency graph fans out:

```
                 ┌─ Slice 3 (store, forms, Sidebar)
1 → 2 → ─────────┼─ Slice 4 (server/, render.yaml)         ← 0 file overlap with 3, 7
                 └─ Slice 7 (src/pdf/, src/App.tsx)         ← touches App.tsx

Slice 5 needs both 3 and 4. Slice 6 needs 4 (and reuses 3's classification). Slice 8 is last.
```

**Safe parallel pairs after Slice 2 lands:**
- **Slice 3 ‖ Slice 4** — recommended. Zero file overlap.
- **Slice 4 ‖ Slice 7** — safe. Zero file overlap.
- **Slice 3 ‖ Slice 7** — possible, but **both can touch `src/App.tsx`**. Slice 3 normally doesn't, but if it migrates the toolbar's `setResume` call sites or the Export region, you'll merge by hand. Slice 7 definitely modifies the Export handler.

**Worktrees:** for true parallel work, use `git worktree add`:
```
git worktree add ../resume-builder-slice4 -b slice/4-deepl HEAD
```
Base from **local `main`** (the latest `feat(locale): …` commit), **not from `origin/main`** — Slices 1+2 may not be pushed yet, so `origin/main` is behind. Verify with `git log --oneline -5` before branching off.

## Required context for every slice

Before starting any slice, make sure the agent reads:

- [CONTEXT.md](../CONTEXT.md) — domain glossary (terms: `Locale`, `Active locale`, `Translatable field`, `Shared field`, `Stale field`)
- [docs/adr/0004-multi-locale-resume.md](./adr/0004-multi-locale-resume.md) — decisions and rationale
- [docs/design-system.md](./design-system.md) — UI/visual conventions
- This file — to see which slice and what comes next, plus the "Repo gotchas" section below

## Repo gotchas

Read these before touching the dev tooling or merging across slices.

- **`tsx watch` is intentionally off in `dev:server`.** On Windows under `concurrently`, `tsx watch` dies silently (the server prints its banner line and never reaches `serve()`, port 8787 stays empty, Vite proxies to nothing and the frontend errors with "Unexpected end of JSON input"). `package.json` therefore runs plain `tsx server/index.ts` for `npm run dev`, and exposes `npm run dev:server:watch` as a standalone script for the rare case where backend hot reload is wanted. **Do not "fix" `dev:server` by adding `watch` back** — it will look fine for a few minutes and then bite.
- **Local commits may be ahead of `origin/main`.** Pushing to GitHub depends on the user's git credentials, which have been flaky. Before branching off in a new worktree, verify with `git log --oneline -5` and base from local `main`, not `origin/main`.
- **`data/resume_es.json` is created by the backend on first read** (clone of EN until Slice 6 swaps it for DeepL translation). If you delete it locally to test bootstrap, the next `GET /resume` regenerates it. Don't commit it casually — Slice 6's test relies on the file being absent.

---

## Slice 1 — Backend dual-file storage

- [ ] **Slice complete**

Sub-tasks:
- [ ] Rename `data/resume.json` → `data/resume_en.json` (git mv).
- [ ] Extend `server/storage.ts`: `readBothLocales(dir): Promise<{ en: Resume; es: Resume }>` and `writeLocale(dir, locale, resume): Promise<void>` (atomic, same temp+rename pattern as today). If `resume_es.json` is missing, clone from `_en.json` (Slice 6 replaces with translation).
- [ ] Update `server/app.ts`:
  - `GET /resume` returns `{ schemaVersion, locales: { en: Resume, es: Resume } }`.
  - `POST /resume` accepts `{ locale: "en" | "es", resume }`, writes the corresponding file.
- [ ] Update `server/index.ts` if it hardcodes a single file path.
- [ ] Add tests in `server/`: read returns both locales; write to one locale doesn't touch the other; missing `_es` gets cloned on first read.
- [ ] Commit: `feat(locale): backend dual-file storage`

**Prompt to paste:**

```
We're implementing the multi-locale Resume feature per ADR-0004 and the slice plan in docs/locale-implementation-plan.md.

Starting Slice 1: Backend dual-file storage.

Read first:
- docs/adr/0004-multi-locale-resume.md
- docs/locale-implementation-plan.md (the "Slice 1" section)
- server/storage.ts and server/app.ts (current shape)

Do exactly what Slice 1 says — no scope creep into the frontend or DeepL. The clone-from-EN-when-ES-missing is the placeholder until Slice 6.

Tests must pass before commit. Commit with `feat(locale): backend dual-file storage` and push.
```

---

## Slice 2 — Frontend store with locales + toolbar toggle

- [ ] **Slice complete**

Sub-tasks:
- [ ] In `src/store.ts`: replace `state.resume` with `state.locales: { en: Resume; es: Resume }`. Add `activeLocale: "en" | "es"` (default `"en"`) and `setActiveLocale(locale)`.
- [ ] The fetch on app load consumes the new envelope `{ schemaVersion, locales }` from `GET /resume`.
- [ ] Audit every `useStore` selector in the app — anywhere reading `s.state.resume.*` becomes `s.state.locales[s.activeLocale].*`.
- [ ] Save flow: when state changes, POST `{ locale: activeLocale, resume: locales[activeLocale] }`.
- [ ] Toolbar: add an `EN | ES` pill toggle next to (left of) the Export button. Style follows the design system — square toggle, indigo accent for active.
- [ ] Verify: typing in EN doesn't affect ES, and vice versa (since no propagation logic yet).
- [ ] Commit: `feat(locale): active-locale toggle + per-locale read/save`

**Prompt to paste:**

```
We're implementing the multi-locale Resume feature per ADR-0004 and the slice plan in docs/locale-implementation-plan.md.

Slice 1 (backend dual-file storage) is done — see latest commit. Starting Slice 2: Frontend store with locales + toolbar toggle.

Read first:
- docs/adr/0004-multi-locale-resume.md
- docs/design-system.md (especially §1 colors and §4 components)
- docs/locale-implementation-plan.md (the "Slice 2" section)
- src/store.ts and src/App.tsx (current shape)
- The "Translatable field" / "Shared field" sections in CONTEXT.md

Stay strictly in Slice 2 scope. No dual-write logic yet (that's Slice 3). No DeepL (Slice 4). Just: locales in store, active toggle, every read reflects active locale, save sends to the active locale's file only.

Commit with `feat(locale): active-locale toggle + per-locale read/save` and push.
```

---

## Slice 3 — Field classification + dual-write actions

- [ ] **Slice complete**

Sub-tasks:
- [ ] Create `src/locale/classification.ts`. Export the canonical lists of Shared vs Translatable from CONTEXT.md as TypeScript constants/types. Reference the ADR.
- [ ] In `src/store.ts`: replace `setResume(producer)` with two actions:
  - `setResumeActiveLocale(producer)` — applies producer to active locale only, saves only that file.
  - `setResumeBothLocales(producer)` — applies producer to both locales (same producer reference, applied twice — once per Resume), saves both files.
- [ ] Migrate every existing `setResume(...)` call site to the right new action. Reference points: Sidebar drag-and-drop, add/remove section, add/remove item, hidden toggle, header name edits → `BothLocales`. Form fields → mostly `ActiveLocale`, with exceptions per the classification table.
- [ ] Type-safety: the producer pattern should make it hard to accidentally edit a Translatable field via `BothLocales` or vice versa. Consider a thin type wrapper if helpful, but don't over-engineer.
- [ ] Backend `POST /resume` already accepts one locale at a time (from Slice 1). For BothLocales, the frontend makes two POSTs — that's fine.
- [ ] Manually test the whole app: every action (add section, drag, hide, edit title, edit description, edit category, add tag…) does what it should — shared changes propagate, translatable changes don't.
- [ ] Commit: `feat(locale): shared vs translatable field classification + dual-write`

**Prompt to paste:**

```
We're implementing the multi-locale Resume feature per ADR-0004 and the slice plan in docs/locale-implementation-plan.md.

Slices 1 and 2 are done. Starting Slice 3: Field classification + dual-write actions.

Read first:
- docs/adr/0004-multi-locale-resume.md (especially the "Field classification is load-bearing" consequence)
- docs/locale-implementation-plan.md — the "Slice 3" section, plus the "Repo gotchas" and "Parallelism" sections at the top
- The "Translatable field" / "Shared field" entries in CONTEXT.md — this is the canonical list to encode
- src/store.ts (post-Slice-2 shape)
- src/components/Sidebar.tsx and src/components/forms/* (all call sites of setResume)

This slice is the trickiest. Be surgical: every existing setResume call must be migrated to ActiveLocale or BothLocales based on what it touches. When in doubt, treat structural changes (add/remove/reorder/hide) and proper-noun fields (TimelineItem.title, CompactGridItem.title, header.*, techStack, tags) as BothLocales. Translatable text edits (subtitle, description, category, ShowcaseItem.title, ShowcaseLink.label, section.title, CompactGridItem.subtitle) as ActiveLocale.

Parallel-work note: Slices 4 and 7 may be running in parallel sessions. Slice 4 is server-only (zero overlap). Slice 7 modifies src/App.tsx (Export button handler) — try not to touch App.tsx unless strictly necessary, and if you do, keep changes scoped so the merge stays clean.

Run tests + manual smoke through every Sidebar action and every form field. Commit with `feat(locale): shared vs translatable field classification + dual-write` and push.
```

---

## Slice 4 — Backend: DeepL integration

> **Parallel-safe**: this slice only touches `server/` and `render.yaml`. Can be done on a separate branch alongside Slice 2 or 3.

- [ ] **Slice complete**

Sub-tasks:
- [ ] Decide and document where the DeepL key lives: `DEEPL_API_KEY` env var.
- [ ] Create `server/translate.ts`. Export `translateText(text: string, targetLocale: "en" | "es"): Promise<string>`. Use the global `fetch` (Node 20+). DeepL Free API base: `https://api-free.deepl.com/v2/translate`.
- [ ] Add `POST /translate` to `server/app.ts`. Accepts `{ text: string, targetLocale: "en" | "es" }`. Returns `{ translated: string }` or 503 if key missing / DeepL errors out.
- [ ] Update `render.yaml`: declare `DEEPL_API_KEY` as a `sync: false` env var so Render prompts for it on deploy (or you set it manually in the dashboard).
- [ ] Tests with a mocked fetch: returns translated, surfaces error, handles missing key.
- [ ] Commit: `feat(locale): backend DeepL translate endpoint`

**Prompt to paste:**

```
We're implementing the multi-locale Resume feature per ADR-0004 and the slice plan in docs/locale-implementation-plan.md.

Starting Slice 4: Backend DeepL integration.

Read first:
- docs/adr/0004-multi-locale-resume.md
- docs/locale-implementation-plan.md — the "Slice 4" section, plus the "Repo gotchas" and "Parallelism" sections at the top
- server/app.ts (current shape)
- DeepL Free API docs: https://developers.deepl.com/api-reference/translate

This slice is server-only — no frontend changes. Make it safe-by-default: missing DEEPL_API_KEY returns 503, not a crash. Tests should mock the DeepL response (don't actually call the API in tests).

Update render.yaml to declare DEEPL_API_KEY as a secret env var.

Parallel-work note: Slices 3 and 7 may be running in parallel sessions. Both are frontend-only; you have zero file overlap with them. Don't touch package.json's `dev:server` script (see "Repo gotchas").

Commit with `feat(locale): backend DeepL translate endpoint` and push.
```

---

## Slice 5 — Frontend: blur-triggered translation + stale tracking

- [ ] **Slice complete**

Sub-tasks:
- [ ] Add hash-based stale tracking to `src/store.ts`: a `translationHashes: Record<fieldPath, { en?: hash; es?: hash }>` map (where `fieldPath` is something like `"sections.adia.subtitle"`).
- [ ] Each Translatable field has a deterministic path. Document the encoding (could be a helper that takes Section ID + field name).
- [ ] In `src/components/forms/shared.tsx`: add `onBlur` to `TextField` and `TextAreaField` that, when the field is Translatable, calls `POST /translate` for the other locale and applies the result via `setResumeActiveLocale` (on the OTHER locale).
- [ ] On translation success: update both the source hash (from active locale's value) and target hash (from translated value).
- [ ] On translation failure: leave both locales' field as-is, but update the source hash (so the divergence vs target hash flags the field as stale).
- [ ] Add a `staleness` derived selector: `isFieldStale(path, locale): boolean` — true when target locale's hash doesn't match the hash of source locale's current value.
- [ ] UI: a small ⚠ icon next to the input when the OTHER locale is stale for that field. Click to retry the translation. Follow design-system §4 patterns.
- [ ] Manual test: edit a translatable field in EN, blur, see ES update. Disconnect (mock 503), edit again, see ⚠. Click retry, see the stale clear.
- [ ] Commit: `feat(locale): blur-triggered translation with stale tracking`

**Prompt to paste:**

```
We're implementing the multi-locale Resume feature per ADR-0004 and the slice plan in docs/locale-implementation-plan.md.

Slices 1–4 are done. Starting Slice 5: Frontend blur-triggered translation + stale tracking.

Read first:
- docs/adr/0004-multi-locale-resume.md (especially "Stale tracking is per-field, hash-based")
- docs/design-system.md (§4 component patterns, §5 interactions)
- docs/locale-implementation-plan.md — the "Slice 5" section, plus the "Repo gotchas" section at the top
- src/store.ts and src/components/forms/shared.tsx (current shape post-Slice-3)
- src/locale/classification.ts (created in Slice 3)

The path encoding for hashes needs to be stable across runs — derive it from existing IDs. Don't over-engineer the hash itself; a simple djb2/SHA-like over the string is enough.

The ⚠ stale marker needs to feel native to the design — see design-system §4. Use the danger color (#F43F5E) but a softer treatment (small icon, tooltip).

Test the full loop manually. Commit with `feat(locale): blur-triggered translation with stale tracking` and push.
```

---

## Slice 6 — Auto-bootstrap of Spanish locale

- [ ] **Slice complete**

Sub-tasks:
- [ ] In `server/storage.ts`: on `readBothLocales`, if `resume_es.json` is missing, walk all Translatable fields of the EN locale, call DeepL for each, build the ES Resume, and write `resume_es.json` atomically before returning.
- [ ] This call may take 5–10 seconds the first time — that's acceptable. Document in the function's comment.
- [ ] Reuse `translate.ts` from Slice 4 — don't duplicate DeepL logic.
- [ ] Use the classification registry from Slice 3 — single source of truth for what to translate.
- [ ] Replace the Slice 1 placeholder ("clone EN → ES").
- [ ] Tests: delete `resume_es.json` in a fixture, hit the read, verify Spanish is generated correctly (mocked DeepL).
- [ ] Commit: `feat(locale): auto-bootstrap Spanish locale on first load`

**Prompt to paste:**

```
We're implementing the multi-locale Resume feature per ADR-0004 and the slice plan in docs/locale-implementation-plan.md.

Slices 1–5 are done. Starting Slice 6: Auto-bootstrap Spanish locale.

Read first:
- docs/adr/0004-multi-locale-resume.md (the "Auto-bootstrap" consequence)
- docs/locale-implementation-plan.md — the "Slice 6" section, plus the "Repo gotchas" section at the top
- server/storage.ts (post-Slice-1 shape) and server/translate.ts (Slice 4)
- src/locale/classification.ts (Slice 3) — reuse this to know which fields to translate

Replace the EN→ES clone placeholder with actual translation. This runs once on first read when resume_es.json is missing. It's OK that it's slow (5–10s) — log progress to stdout.

If DEEPL_API_KEY is missing, fall back to the clone behavior (so dev still works without a key) and log a clear warning.

Test setup: the "Repo gotchas" section notes that `data/resume_es.json` is regenerated on first read whenever it's absent. Make sure your tests delete it before exercising the bootstrap path, and your manual smoke does the same.

Commit with `feat(locale): auto-bootstrap Spanish locale on first load` and push.
```

---

## Slice 7 — ZIP export of both PDFs

- [ ] **Slice complete**

Sub-tasks:
- [ ] Install `jszip` (`npm i jszip`).
- [ ] Update `src/pdf/format.ts`: `formatDateRange` and `formatFlexibleDate` take a `locale: "en" | "es"` parameter and translate the month name ("March" → "Marzo"). Define a small static month table per locale — no DeepL needed for these.
- [ ] Update `src/pdf/Resume.tsx` (and whatever passes resume to it) to accept a `locale` and pass it through to the formatters and the rendered text.
- [ ] In `src/App.tsx` Export button handler:
  - Generate `<Resume resume={en} locale="en" />` → PDF blob.
  - Generate `<Resume resume={es} locale="es" />` → PDF blob.
  - Zip them as `EmanuelRodriguezBedeman.pdf` + `EmanuelRodriguezBedeman_es.pdf`.
  - Trigger download of `EmanuelRodriguezBedeman_resumes.zip` (filename uses slugified name).
- [ ] The button copy stays "Export PDF" (don't change to "Export PDFs" — feels wrong). Tooltip: "Download both English and Spanish".
- [ ] Manual test: click Export, get a ZIP with both files; both PDFs render correctly with month names translated.
- [ ] Commit: `feat(locale): ZIP export of both locale PDFs`

**Prompt to paste:**

```
We're implementing the multi-locale Resume feature per ADR-0004 and the slice plan in docs/locale-implementation-plan.md.

Slices 1–6 are done (or Slices 1–2 if running in parallel with Slices 3 and 4 — this slice only needs the locale envelope shape from Slice 2). Starting Slice 7: ZIP export of both PDFs.

Read first:
- docs/adr/0004-multi-locale-resume.md
- docs/locale-implementation-plan.md — the "Slice 7" section, plus the "Repo gotchas" and "Parallelism" sections at the top
- src/App.tsx (current Export button)
- src/pdf/Resume.tsx and src/pdf/format.ts

Use jszip. The Spanish month names are a small static table — don't call DeepL for them (overkill and DeepL might give weird capitalization).

Parallel-work note: Slice 3 may be running in a parallel session. Both slices may touch src/App.tsx — keep your changes scoped to the Export handler and the locale/PDF prop wiring; don't refactor unrelated parts of the toolbar.

Commit with `feat(locale): ZIP export of both locale PDFs` and push.
```

---

## Slice 8 — Polish

- [ ] **Slice complete**

Sub-tasks:
- [ ] Loading indicator on inputs while their translation is in-flight (small inline spinner).
- [ ] Clear error toast / message when DeepL fails (not just the silent ⚠).
- [ ] If the field-level stale UI got reusable, consolidate it as a documented pattern in `docs/design-system.md` §4.
- [ ] Skim the whole app once more — anything that feels off in the bilingual flow?
- [ ] Commit: `feat(locale): polish — inline loading + error feedback`

**Prompt to paste:**

```
We're closing out the multi-locale Resume feature per ADR-0004. Slices 1–7 are done.

Starting Slice 8: Polish.

Read first:
- docs/locale-implementation-plan.md — the "Slice 8" section, plus the "Repo gotchas" section at the top
- The actual app behavior across both locales

This is the catch-all for "now that it works, what's clunky?". The two known items are: (a) no visible feedback while DeepL is responding, (b) DeepL failures only show as ⚠, no toast/error.

Add what's needed without scope-creeping into new features. Commit with `feat(locale): polish — inline loading + error feedback` and push.
```

---

## After all slices

- [ ] All eight slices committed and pushed.
- [ ] [CONTEXT.md](../CONTEXT.md) reflects the final terminology.
- [ ] [ADR-0004](./adr/0004-multi-locale-resume.md) reflects what was actually built (revise if anything diverged).
- [ ] Smoke test on Render: deploy, verify Spanish CV downloads with the demo data.
- [ ] Consider: add a /to-issues run to track future Locale-related features (more locales, custom translations override, etc.).
