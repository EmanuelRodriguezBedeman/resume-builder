# Resume Builder

A personal web app for editing a CV that matches the format of the user's existing CV PDFs (in `docs/reference/source-cv/`) and exports them as PDF. Replaces the user's prior Canva-based workflow, which was slow and tedious for iterative edits.

## Language

**Resume**:
The full CV document the user edits and exports. Single-user — one `Resume` per user.

**Section**:
A top-level grouping within a `Resume`. Has one `Section type` and contains `Items`.
_Avoid_: "block", "group"

**Section type**:
One of a fixed catalog of layout patterns that determines what fields an `Item` carries and how items render in the PDF. MVP catalog: `Header`, `Timeline section`, `Compact grid section`, `Showcase section`, `Categorized tags section`. User-defined section types are deferred to a later iteration.
_Avoid_: "section style", "section layout"

**Item**:
A single entry inside a `Section`. Available fields depend on the parent section's `Section type`.
_Avoid_: "content" (overloaded), "entry", "record"

**Header**:
The special `Section type` always rendered at the top of the `Resume`. Contains the user's name plus `Header items` (icon + text/link pairs: email, phone, GitHub, location, etc.). Unlike normal sections, it has no section heading line.

**Timeline section**:
`Section type` used for Experience. Items carry: title (organization), uppercase subtitle (role), date range on the right, and free-form description (paragraph or bullets, with optional bold lead-in per bullet).

**Compact grid section**:
`Section type` used for Education, Courses, and Languages. Items carry: title, optional date inline, optional uppercase subtitle. No description. Renders in a 2-column grid.

**Showcase section**:
`Section type` used for Projects. Items carry: title, bracketed tech-stack as subtitle, description, and N footer links (each icon + label). No date.

**Categorized tags section**:
`Section type` used for Skills. Items are categories (e.g. Primary, Secondary, Databases), each with a comma-separated list of tags. Each row renders as `bold-category: tag, tag, tag`.

**Locale**:
A language version of the `Resume`. The app supports two locales: `en` (English) and `es` (Spanish). Locales are **peers** — neither is the source of truth, both are valid edit targets.

**Active locale**:
The locale currently being edited and previewed. Toggled from the toolbar. Drives what the sidebar, form panel, and live preview render.

**Translatable field**:
A field whose value differs between locales. Examples: `section.title`, `descriptionBlock.text` / `.leadIn`, `categorizedTagsItem.category`, `ShowcaseItem.title`, `TimelineItem.subtitle`, `CompactGridItem.subtitle`, `ShowcaseLink.label`. Edits to a Translatable field on field blur trigger automatic translation into the other locale.

**Shared field**:
A field whose value is identical across all locales. Edits propagate to every locale immediately. Examples: every `id`, every `href`, every `IconName`, `section.type`, `section.hidden`, `schemaVersion`, all date strings (the rendered month name is per-locale, but the stored ISO date is shared), `header.name`, `header.items[*].text` and `.href` (the entire `Header` is shared — proper nouns / contact data don't translate), `TimelineItem.title` (organization names), `CompactGridItem.title` (institution names), `ShowcaseItem.techStack`, `CategorizedTagsItem.tags`.

**Stale field**:
A `Translatable field` whose other-locale counterpart no longer reflects the source text — typically because the translation service was unavailable when the source was edited. Surfaced with a ⚠ indicator and a manual retry.

## Relationships

- A `Resume` has exactly one `Header` and many other `Sections`
- A `Section` has exactly one `Section type` and many `Items`
- An `Item`'s available fields are determined by its parent section's `Section type`
- Every `Resume` exists in N `Locales` simultaneously; structure (`id`s, ordering, `Section type`, `Shared field` values) is identical across locales, only `Translatable field` values differ

## Flagged ambiguities

- The user originally called items "contenido" — resolved as **Item** for clarity, since "content" is overloaded in software contexts.
- Languages was initially grouped with Skills as a single "Labeled list" type — resolved by inspecting the actual PDF: Languages fits **Compact grid section** (without date/subtitle), Skills is its own type (**Categorized tags section**).
