# Design System

The editor UI is a fusion of **LinkedIn** (trusty blue) and **Canva** (vibrant violet) on a unified indigo dark base. This document is the working reference for building new screens or features so the visual language stays coherent.

**Source of truth for tokens**: [`src/theme.ts`](../src/theme.ts). This document explains *why* and *when* to use each — not the hex values themselves.

---

## 1. Color palette

### Hue meanings

Each hue carries a specific role. Don't mix roles.

| Hue | Token group | Role |
|---|---|---|
| **LinkedIn blue** `#0A66C2` → bright `#3B82F6` | toolbar left, brand mark, header section | Trust, professionalism, brand anchor |
| **Indigo** `#5B4FE5`, `#4F46E5` | `primary`, `primaryHover` | Active accents: input focus rings, checkbox tints, mid-point of brand gradients |
| **Canva violet** `#7C3AED` → `#A78BFA` (lighter) | sidebar selection, toolbar right end | Selection, identity, "this is the special thing" |
| **Cyan** `#06B6D4` | toolbar right end, Export button anchor | Pop / contrast against violet, "fresh" energy |
| **Rose** `#F43F5E` (danger) | Remove links, confirm-delete button | Destructive — kept slightly pink to flow with violet/cyan rather than alarm-red |
| **Green** `#22C55E` | section "visible in PDF" eye icon | Status — "this is on / live / visible" |
| **Muted indigo-gray** `#A2A6CB` | `sidebarTextMuted`, `panelTextMuted` | Secondary text, icons in their idle state |

### Dark surface ladder

Layered backgrounds use the **same indigo hue at increasing luminance**. Layered top-to-bottom, lighter values are "raised" surfaces:

| Surface | Token | Use |
|---|---|---|
| Form panel deepest | `panelBg` `#1E2042` | The right panel base |
| Sidebar | `sidebarBg` `#252850` | The left panel base — visibly lighter than the form panel so they read as distinct surfaces |
| Card raised | `panelCardBg` `#2F3260` | Cards inside the form panel (description blocks, contact items) |
| Input recessed | `panelInputBg` `#171830` | Inputs sit below their parent card, signaling "input target" via lower luminance |

> **Rule**: when adding a new dark surface, decide where it sits in this ladder. Don't invent new dark hues — keep the indigo family.

### Brand gradients

Two cinematic gradients carry the brand:

**Toolbar gradient** (`linear-gradient(90deg, #7C3AED 0%, #1A1F2E 50%, #06B6D4 100%)`): violet → dark navy dip → cyan, left to right. The dark mid-point gives the gradient its drama — never a simple 2-color blend.

**Export PDF gradient** (`linear-gradient(135deg, #06B6D4 0%, #7C3AED 100%)`): cyan top-left → violet bottom-right. **Reversed** from the toolbar so the cyan end "picks up" the toolbar's cyan right edge where the button sits, and the violet end gives the button its own pop.

**Selection gradient** (sidebar selected row): `linear-gradient(135deg, #0A66C2 0%, #7C3AED 100%)` — LinkedIn blue → Canva violet. Selection moments are the literal "LinkedIn × Canva" expression of the brand.

> **Rule**: gradients are reserved for *moments* (toolbar, primary action, current selection). Body content and surfaces use flat colors.

---

## 2. Layout

### Three-pane editor

```
┌─────────────┬──────────────────┬────────────────────┐
│  Sidebar    │  Form panel      │  HtmlPreview       │
│  (left)     │  (right of side) │  (rest)            │
│  resizable  │  resizable       │  flex: 1           │
│  220–500px  │  280–650px       │                    │
└─────────────┴──────────────────┴────────────────────┘
```

Widths persist in the store (`sidebarWidth`, `formPanelWidth`). The user drags the right edge of each panel (5px transparent handle, `cursor: ew-resize`) to resize. Both panels collapse to a thin rail (~36–44px); the sidebar's collapse toggles **both** panels together, the form panel has its own independent toggle.

### Panel rail pattern

A "rail" is a thin strip on a panel that hosts the panel's toggle button:
- **Sidebar rail**: removed in current iteration — toggle moved to top-left as a square button. Resize is a separate transparent strip on the right edge.
- **Form panel rail**: 36px on the right side. Holds the round overhang button at vertical center.

### Section spacing in the sidebar

Sections in the sidebar are separated by a 1px hairline (`sidebarBorder`) + 1rem padding/margin above. This vertical rhythm reads as "groups", not a tight list.

---

## 3. Typography

**Family**: Inter (Google Fonts). System fallback chain in `index.html`.

**Scale** (use these only):

| Size | rem | Use |
|---|---|---|
| Label uppercase | 0.7–0.72rem | Form field labels, "RESUME STRUCTURE" header. `letterSpacing: 0.5–0.8px`, `fontWeight: 600–700`, `textTransform: uppercase`. |
| Small body | 0.78rem | Helper/description text, button copy in compact UI |
| Body | 0.85–0.9rem | Item rows, regular inputs |
| Section heading | 0.92–0.95rem | Section row in sidebar, "Resume Structure" title |
| Form heading | 1rem | Form panel form titles ("Experience entry") |
| Brand mark | 0.95rem `fontWeight: 700` | Toolbar brand title |

**Weights**: only 400, 500, 600, 700.

**Color hierarchy** (three-tier, applies in the sidebar and generalizes):
- **Top tier** — bright text (`sidebarText` `#F4F4F7`, weight 700): section headings, the brand
- **Mid tier** — soft off-white (`#D2D5E5`, weight 500): item names, body
- **Bottom tier** — muted (`sidebarTextMuted` `#A2A6CB`): icons, labels, helper text

---

## 4. Recurring components

### Round overhang toggle button

**Where**: form panel rail (right edge).
**Shape**: 30×30px circle, `borderRadius: 50%`.
**Position**: `position: absolute`, anchored at the panel's right edge with `right: 0; transform: translate(50%, -50%)` → button center sits on the panel border, half inside / half outside.
**Style**: subtle bg (`panelCardBg`), translucent white border, soft shadow. Container needs `position: relative; zIndex: 1` so the overhang isn't covered by the preview area.
**Icon**: `ChevronLeft` (collapse) / `ChevronRight` (expand) — points in the direction motion will go.

> **Use for**: toggles on the *outer edge* of a panel where the action moves the panel toward/away from a neighbor.

### Square top-left toggle button

**Where**: sidebar top-left.
**Shape**: 30×30px square with `borderRadius: theme.radius.sm` (soft corners).
**Position**: regular flex child at the top of the panel, left-aligned.
**Icon**: `ArrowLeft` / `ArrowRight` (arrow with tail, not chevron — visually distinct from in-row chevrons).

> **Use for**: panel-level primary actions that don't live on the panel's boundary. Square shape reads as "page-level UI", not "in-flow widget".

### InlineConfirm (destructive action)

**Where**: any destructive action (Remove section/item/block/link/contact).
**Shape**: a trigger (any element you pass) that, on click, *morphs* into a [✓ red][✕ neutral] pair on the same spot. Click outside or press Escape → cancel. No native `window.confirm`.
**File**: [`src/components/InlineConfirm.tsx`](../src/components/InlineConfirm.tsx).

> **Use for**: any irreversible action. Never use `window.confirm`.

### Card raised + input recessed (form panel)

Pattern for editing groups of related fields inside the dark form panel:

```
[panel bg #1E2042]
  [card bg #2F3260 — raised, soft border]
    [input bg #171830 — recessed, sits inside the card]
```

**Rule of three luminances**: each surface is visibly +/- from its parent. The eye reads it as "this is a container of inputs about one thing".

### Filled input with focus ring

**Default**: `background: panelInputBg`, no visible border (just `1px solid transparent` to reserve space).
**Focus**: imperative `boxShadow: 0 0 0 2px ${primary}` set in `onFocus` handler; cleared in `onBlur`. Used in [`src/components/forms/shared.tsx`](../src/components/forms/shared.tsx).

---

## 5. Interactions

### Hover

Each interactive row (sidebar section, sidebar item, header button) has a subtle hover state: `sidebarHoverBg` (rgba(255,255,255,0.06)) background. Driven by the global `hovered` field in the store — set on `mouseenter`, cleared on `mouseleave`.

The same `hovered` signal drives the **preview hover outline**: the corresponding block in the live preview gets a thin indigo outline (`outline: 2px solid rgba(91,79,229,0.7)` with `outlineOffset: 4px`). Outline (not border) so it doesn't shift layout. If the block is scrolled off-viewport, the outline naturally isn't visible — no auto-scroll for hover.

### Selection

Clicking a row in the sidebar selects it. Two simultaneous effects:
1. **Form panel** auto-expands and renders the editor for that target.
2. **Preview** scrolls the corresponding block into view (`scrollIntoView({ behavior: "smooth", block: "nearest" })`) and applies the same outline as hover. The outline persists while the selection is active.

> **Why the same outline visual for both hover and selection?** Different sources, same observation pattern — "this is what the cursor is referring to". Selection is just "sticky hover".

### Click-anywhere-on-row

The `onClick` for sidebar section/item rows is on the **outer row container**, not the inner text element. Any click on the highlighted area selects. Eye/trash icons stop propagation; drag handle uses dnd-kit's pointer listeners which don't trigger click without movement.

### Parent highlighting

When an item is selected in the sidebar, its **parent section row** also lights up (with hover-bg, not the bold selection gradient — the gradient stays on the actual target). Lets the user keep their bearings in deep trees.

### Collapse/expand affordances

- The square top-left button collapses **both** panels together (single action, common case).
- The form panel's round button toggles only itself, for fine-tuned cases.
- Selecting any sidebar row auto-expands the form panel (no need to manually expand before editing).

---

## 6. Visual hierarchy rules

When building a new list/tree UI, encode three priority tiers:

1. **Primary** (700 weight, bright text): section names, headings, brand.
2. **Secondary** (500 weight, soft off-white): item names, body content.
3. **Tertiary** (regular weight, muted indigo-gray): icons, helper labels, metadata.

Don't have everything be 600+ — it flattens the hierarchy and makes scanning harder.

---

## 7. Scrollbar

Custom global rule in [`index.html`](../index.html): thin (10px), translucent indigo-gray thumb (`rgba(190, 196, 222, 0.6)`), transparent track, padding-box border trick so the thumb appears "floating".

Works on both the dark editor panels (visible on dark bg) and the light preview (visible on light gray bg) thanks to the neutral indigo-gray.

---

## 8. Brand mark & attribution

The toolbar brand block has a two-line structure:
- **Title** (700 weight, 0.95rem, white): "Resume Builder"
- **Subtitle** (500 weight, 0.66rem, `rgba(255,255,255,0.65)`): "© 2026 Emanuel Rodriguez Bedeman"

> **Rule**: the attribution line is the canonical authorship notice for the editor UI. Keep it everywhere the brand mark is rendered.

Icon: `FileText` from lucide-react, in a 28×28 glass badge (`rgba(255,255,255,0.18)` bg, translucent white border) to the left of the title.

---

## 9. Adding new screens / routes

When building a new page that isn't the main editor:

- **Stay on the indigo dark ladder** for surfaces. Don't introduce a new dark base hue.
- **Reuse `theme.color.primary`** for focus rings, accents, primary actions.
- **Use the same Inter scale**. Don't introduce sizes outside the table in §3.
- **Pick the right toggle pattern**: round overhang for panel-edge UI, square top-left for panel-level UI.
- **Inline destructive flows via `InlineConfirm`**. Never `window.confirm`.
- **Hover outline applies anywhere** there's a visible target list ↔ visible content mapping.
- **Action buttons that are primary** can use the Export gradient (`primaryGradient`) but only **one per view** — otherwise multiple "primary"s flatten the importance.
- **Section dividers** are 1px hairlines using `sidebarBorder` (white at 8% alpha), with 1rem breathing room above.

When in doubt, look at how the editor already solves the same problem. If the existing pattern doesn't fit, document the new variant here before shipping it — additions to this doc are how the design system grows.
