# Resume Builder

Personal web app for editing a CV that matches the format of the user's existing Canva-built PDF and exports a faithful copy via React-PDF. Built to replace an iterative Canva workflow with something faster: structured data + live HTML preview + one-click PDF export, with the entire CV history versioned in git.

## What it does

A three-pane editor backed by a single JSON file (`data/resume.json`):

- **Sidebar** — section tree with drag-to-reorder, expand/collapse per section, add/remove sections and items, hide/show toggle per section.
- **Form panel** — context-aware fields for whatever is selected. Edits the Header (name + contact items) or a section item (Timeline, Compact grid, Showcase, Categorized tags). Tag arrays use chips; project links are card lists with add/remove; dates support a "Present" toggle.
- **Live preview** — a DOM render of the CV that updates instantly as you type, with scroll preserved. Visually parallel to the PDF export.

The toolbar's **Export PDF** button downloads the CV via React-PDF.

Every edit auto-saves to `data/resume.json` ~500 ms after typing stops, so committing your changes (or reverting with `git checkout data/resume.json`) is the undo system.

## Tech stack

- **React 19 + TypeScript 6 + Vite 8** — frontend
- **@react-pdf/renderer 4** — authoritative PDF export
- **Parallel DOM render** in `src/preview/` — live preview without iframe reloads (see [ADR-0003](docs/adr/0003-dual-render-html-preview-pdf-export.md))
- **Hono 4** + **@hono/node-server** — minimal backend that reads and atomically writes `data/resume.json`
- **Zustand 5** — store with a generic `setResume(producer)` mutation backed by pure updaters
- **@dnd-kit** — drag-to-reorder for sections and items
- **Vitest 4** — 60 tests covering file I/O, the Hono app, store actions, the debounce, every updater, and a smoke render of the React-PDF tree
- **tsx + concurrently** — dev runner

Node 22+ and npm 10+.

## Run locally

### 1. Prerequisites

- **Node 22+** and **npm 10+**. Check with `node --version` and `npm --version`.
- A modern browser (Chrome, Edge, Firefox).

### 2. Clone and install

```bash
git clone https://github.com/EmanuelRodriguezBedeman/resume-builder.git
cd resume-builder
npm install
```

### 3. Start the dev servers

```bash
npm run dev
```

This runs the Hono backend and the Vite frontend concurrently:

- Backend: `http://localhost:8787` (serves `/resume`, `/health`, `/`)
- Frontend: `http://localhost:5173` (Vite, with hot module reload)

Wait for the line `[server] listening on http://localhost:8787` and Vite's `ready in …` line, then open `http://localhost:5173` in the browser.

### 4. Edit your CV

The editor loads `data/resume.json` on startup. Click any section or item in the left sidebar, edit fields in the middle panel, and watch the live preview on the right update as you type. Changes auto-save to `data/resume.json` ~500 ms after typing stops.

To use a different CV, replace `data/resume.json` with your own (the shape is documented in [`CONTEXT.md`](CONTEXT.md) and the TypeScript types in [`src/types.ts`](src/types.ts)). Reload the page and the editor picks it up.

### 5. Export the PDF

Click **Export PDF** in the top-right of the toolbar. The browser downloads a PDF named after the resume header (e.g. `Emanuel_Rodriguez_Bedeman.pdf`).

### 6. Stop / restart

`Ctrl+C` in the terminal where `npm run dev` is running stops both processes. Run `npm run dev` again to resume — the editor will load whatever is in `data/resume.json`, including changes from the previous session.

### Useful scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Run both backend and frontend in watch mode |
| `npm run dev:server` | Run just the Hono backend |
| `npm run dev:web` | Run just the Vite frontend (expects backend running) |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | `tsc -b --noEmit` over the whole project |
| `npm run build` | Production build of the frontend |
| `npm run preview` | Serve the production build for sanity-checking |

### Versioning your CV

`data/resume.json` is checked into git on purpose. Every edit changes the file; commit when you reach a state you want to keep, and you get a free history of your CV with `git log data/resume.json`. To revert unsaved local edits, run `git checkout data/resume.json`.

### Troubleshooting

- **Port already in use** (`EADDRINUSE`) — another process is on `8787` or `5173`. Kill it (`taskkill /F /PID …` on Windows, `kill …` elsewhere) and retry.
- **Backend not reachable** in the browser — confirm both `npm run dev` log lines appeared. Vite proxies `/resume` and `/health` to the backend; if the backend crashed, the proxy returns errors.
- **Slash commands missing** (`/grill-me`, `/to-prd`, etc.) in Claude Code — that's the local plugin in `claude-skills/`. After cloning or moving the folder, restart Claude Code so the marketplace cache refreshes.

## How it works

`data/resume.json` is the single source of truth. The Hono backend exposes:

- `GET /resume` — returns the parsed Resume (sensible default if the file is missing)
- `POST /resume` — writes the Resume atomically (write to a sibling tmp file, then `rename`)
- `GET /health` — JSON `{ ok: true }`
- `GET /` — short endpoints summary

The React frontend fetches `/resume` on mount, stores the result in Zustand, and renders three panels reading from that store. Each form widget calls a pure updater function from `src/updaters.ts` via the store's `setResume(producer)` action; every mutation enqueues a debounced `POST /resume`.

The live preview in `src/preview/` and the PDF export in `src/pdf/` are intentionally parallel component trees. The preview uses DOM (instant updates, scroll preserved by the browser); the export uses React-PDF (produces the artifact you actually send out). Both trees are styled in `pt` for size parity; the file structure mirrors one-for-one so changes can be applied to both with minimal drift.

## Project layout

```
/
├── .claude/               Claude Code config (local plugin marketplace)
├── CLAUDE.md              Project instructions for Claude Code
├── CONTEXT.md             Domain glossary (Resume, Section, Item, the 5 Section types)
├── claude-skills/         Matt Pocock's skill plugin — Claude Code tooling, not app code
├── data/
│   └── resume.json        Single source of truth for the CV
├── docs/
│   ├── adr/               Architecture decision records
│   │   ├── 0002-pdf-rendering-via-react-pdf.md
│   │   └── 0003-dual-render-html-preview-pdf-export.md
│   └── agents/            Claude agent configuration (issue tracker, triage, domain)
├── Resumes/               Original PDF templates used as the visual target
├── server/                Hono backend
│   ├── app.ts             createApp factory — injectable data path for testability
│   ├── index.ts           Production entry that wires the app to data/resume.json
│   └── storage.ts         Atomic readResume / writeResume
├── src/                   React frontend
│   ├── App.tsx            Three-pane layout, toolbar, Export PDF button
│   ├── components/        Editor UI (Sidebar, FormPanel, per-section forms)
│   ├── pdf/               React-PDF tree (export)
│   ├── preview/           DOM tree (live preview)
│   ├── store.ts           Zustand store
│   ├── save.ts            Debounced backend saver
│   ├── updaters.ts        Pure (Resume, args) → Resume mutations
│   └── types.ts           Discriminated union of Section types
├── index.html
├── package.json
├── tsconfig.json (+ app, node)
└── vite.config.ts         Vite + backend proxy + Vitest config
```

## Background

The visual style and the catalog of five `Section` types (Timeline, Compact grid, Showcase, Categorized tags, plus the special Header) were derived from the user's actual Canva-built CV (in `Resumes/Latest/`). The vocabulary in `CONTEXT.md` and the discriminated union in `src/types.ts` reflect that source.

The project was built incrementally through three phases (risk validation → MVP edit → full CRUD) plus a follow-up phase that swapped the PDF preview for a parallel DOM preview ([ADR-0003](docs/adr/0003-dual-render-html-preview-pdf-export.md)). The slicing and writeup were driven through Matt Pocock's [skills repo](https://github.com/mattpocock/skills) — its `/grill-with-docs`, `/to-prd`, and `/to-issues` commands produced the domain glossary, the ADRs, and the GitHub issue series that tracked the work. That tooling lives in `claude-skills/` and is registered as a local Claude Code plugin via `.claude/settings.json`.
