# Resume Builder

A personal web app for editing a CV that matches the format of the user's existing CV PDFs (in `Resumes/`) and exports them as PDF. Replaces the user's prior Canva-based workflow, which was slow and tedious for iterative edits.

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

## Relationships

- A `Resume` has exactly one `Header` and many other `Sections`
- A `Section` has exactly one `Section type` and many `Items`
- An `Item`'s available fields are determined by its parent section's `Section type`

## Flagged ambiguities

- The user originally called items "contenido" — resolved as **Item** for clarity, since "content" is overloaded in software contexts.
- Languages was initially grouped with Skills as a single "Labeled list" type — resolved by inspecting the actual PDF: Languages fits **Compact grid section** (without date/subtitle), Skills is its own type (**Categorized tags section**).
