# PDF rendering via React-PDF, targeting "same visual family" fidelity

The Resume Builder must reproduce the format of the user's existing Canva-built CV. We chose **same-visual-family fidelity** rendered via **React-PDF** (`@react-pdf/renderer`), accepting minor spacing/kerning differences in exchange for a much simpler architecture: one declarative React component serves both the live preview and the export, with no backend and no LaTeX toolchain.

## Considered options

- **LaTeX (byte-identical)** — rejected: no `.tex` source exists, requires local TeX install and slow compilation.
- **HTML+CSS via Playwright headless browser (pixel-faithful)** — rejected for MVP: requires a backend to drive Chromium. Held as the fallback if React-PDF's output proves too divergent.
- **React-PDF (same visual family)** — chosen.

## Consequences

- Editor framework is locked to React.
- If output divergence is unacceptable, migration to Playwright is the documented fallback (revisit this ADR).
