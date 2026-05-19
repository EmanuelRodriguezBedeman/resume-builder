import { useState, type CSSProperties } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import type { Resume, Section } from "../types.ts";
import { useStore, type Selection } from "../store.ts";
import {
  withItemAdded,
  withItemRemoved,
  withItemsReordered,
  withSectionAdded,
  withSectionHiddenToggled,
  withSectionRemoved,
  withSectionsReordered,
  type AddableSectionType,
} from "../updaters.ts";
import { theme } from "../theme.ts";
import { InlineConfirm } from "./InlineConfirm.tsx";

const SECTION_PREFIX = "section:";
const ITEM_PREFIX = "item:";

// -- helpers ------------------------------------------------------------

function itemLabel(section: Section, itemId: string): string {
  if (section.type === "categorizedTags") {
    const item = section.items.find((i) => i.id === itemId);
    return item?.category ?? itemId;
  }
  const item = section.items.find((i) => i.id === itemId);
  return item?.title ?? itemId;
}

function isSelected(selection: Selection, target: Selection): boolean {
  if (selection.kind !== target.kind) return false;
  if (selection.kind === "section" && target.kind === "section") {
    return selection.sectionId === target.sectionId;
  }
  if (selection.kind === "item" && target.kind === "item") {
    return (
      selection.sectionId === target.sectionId &&
      selection.itemId === target.itemId
    );
  }
  return true;
}

// -- styles -------------------------------------------------------------

const SIDEBAR_COLLAPSED_W = 44;
const SIDEBAR_RESIZE_HANDLE_W = 5;

const asideStyle = (collapsed: boolean, width: number): CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  width: collapsed ? `${SIDEBAR_COLLAPSED_W}px` : `${width}px`,
  flexShrink: 0,
  height: "100%",
  background: theme.color.sidebarBg,
  color: theme.color.sidebarText,
  borderRight: `1px solid ${theme.color.sidebarBorder}`,
  fontFamily: theme.font.family,
  boxSizing: "border-box",
  position: "relative",
});

const topButtonRowStyle = (collapsed: boolean): CSSProperties => ({
  display: "flex",
  justifyContent: collapsed ? "center" : "flex-start",
  padding: "0.6rem 0.6rem 0.3rem",
  flexShrink: 0,
});

const squareToggleButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "30px",
  height: "30px",
  borderRadius: theme.radius.sm,
  background: "rgba(255, 255, 255, 0.06)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  color: theme.color.sidebarText,
  cursor: "pointer",
  padding: 0,
};

const sidebarBodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "0.4rem 0.75rem 1rem",
  boxSizing: "border-box",
};

const sidebarResizeHandleStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  // Straddle the right border so the grab area extends slightly past
  // the visible edge — easier to hit with the cursor.
  right: `-${Math.floor(SIDEBAR_RESIZE_HANDLE_W / 2)}px`,
  width: `${SIDEBAR_RESIZE_HANDLE_W}px`,
  height: "100%",
  cursor: "ew-resize",
  zIndex: 3,
};

const rowBase: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0.5rem 0.65rem",
  borderRadius: theme.radius.md,
  cursor: "pointer",
  userSelect: "none",
  transition: "background 120ms",
};

// `active` covers hover + "parent section of the selected item" — both
// states surface the same subtle sidebarHoverBg, so a section row lights
// up whenever the user is hovering it OR has selected one of its items.
const sectionRowStyle = (selected: boolean, active: boolean): CSSProperties => ({
  ...rowBase,
  marginTop: "0.35rem",
  fontSize: "0.92rem",
  fontWeight: 600,
  background: selected
    ? theme.color.sidebarSelectedBg
    : active
      ? theme.color.sidebarHoverBg
      : "transparent",
  color: selected
    ? theme.color.sidebarSelectedText
    : theme.color.sidebarText,
  justifyContent: "space-between",
  gap: "0.3rem",
});

const itemRowStyle = (selected: boolean, active: boolean): CSSProperties => ({
  ...rowBase,
  marginLeft: "1.5rem",
  marginTop: "0.2rem",
  fontSize: "0.85rem",
  background: selected
    ? theme.color.sidebarSelectedBg
    : active
      ? theme.color.sidebarHoverBg
      : "transparent",
  // Item names sit second in the visual hierarchy after section names:
  // a soft off-white — brighter than the muted icons but quieter than
  // the section title.
  color: selected ? theme.color.sidebarSelectedText : "#D2D5E5",
  fontWeight: selected ? 600 : 500,
  justifyContent: "space-between",
  gap: "0.3rem",
});

const addItemButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  // Align the dashed border with where the item NAME starts (not just
  // the drag handle). Item-row text begins at: marginLeft 1.5rem +
  // padding-left 0.65rem + drag-handle (~1.25rem) + 2px margin ≈ 3.5rem.
  marginLeft: "3.5rem",
  marginTop: "0.4rem",
  padding: "0.3rem 0.6rem",
  fontSize: "0.78rem",
  background: "transparent",
  border: `1px dashed ${theme.color.sidebarTextMuted}`,
  borderRadius: theme.radius.sm,
  color: theme.color.sidebarTextMuted,
  cursor: "pointer",
  fontFamily: theme.font.family,
};

const iconBtnBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "transparent",
  borderRadius: theme.radius.sm,
  cursor: "pointer",
  padding: "3px",
  flexShrink: 0,
};

const dragHandleStyle: CSSProperties = {
  ...iconBtnBase,
  cursor: "grab",
  color: theme.color.sidebarTextMuted,
  marginRight: "2px",
};

const addSectionButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.4rem",
  width: "100%",
  marginTop: "1.25rem",
  padding: "0.65rem",
  fontSize: "0.86rem",
  fontWeight: 600,
  background: "transparent",
  border: `1px dashed ${theme.color.sidebarTextMuted}`,
  borderRadius: theme.radius.md,
  color: theme.color.sidebarText,
  cursor: "pointer",
  fontFamily: theme.font.family,
};

const pickerStyle: CSSProperties = {
  marginTop: "0.5rem",
  padding: "0.5rem",
  background: "rgba(255, 255, 255, 0.04)",
  border: `1px solid ${theme.color.sidebarBorder}`,
  borderRadius: theme.radius.md,
};

const pickerOptionStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "0.5rem 0.6rem",
  border: "none",
  background: "transparent",
  borderRadius: theme.radius.sm,
  fontSize: "0.85rem",
  color: theme.color.sidebarText,
  cursor: "pointer",
  fontFamily: theme.font.family,
};

// -- sortable item row --------------------------------------------------

function SortableItemRow({
  section,
  item,
}: {
  section: Section;
  item: { id: string };
}) {
  const selection = useStore((s) => s.selection);
  const selectItem = useStore((s) => s.selectItem);
  // Sidebar only does structural ops (remove, reorder, add, hide), so every
  // mutation here is BothLocales — keeps IDs and ordering in sync.
  const setResumeBothLocales = useStore((s) => s.setResumeBothLocales);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ITEM_PREFIX + item.id });

  const itemSelected = isSelected(selection, {
    kind: "item",
    sectionId: section.id,
    itemId: item.id,
  });
  const label = itemLabel(section, item.id);
  const hovered = useStore(
    (s) =>
      s.hovered.kind === "item" &&
      s.hovered.sectionId === section.id &&
      s.hovered.itemId === item.id,
  );
  const setHovered = useStore((s) => s.setHovered);
  const clearHovered = useStore((s) => s.clearHovered);

  const wrapperStyle: CSSProperties = {
    ...itemRowStyle(itemSelected, hovered),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      onClick={() => selectItem(section.id, item.id)}
      onMouseEnter={() =>
        setHovered({ kind: "item", sectionId: section.id, itemId: item.id })
      }
      onMouseLeave={clearHovered}
    >
      <span
        {...attributes}
        {...listeners}
        style={dragHandleStyle}
        title="Drag to reorder"
        aria-label={`Drag handle for ${label}`}
      >
        <GripVertical size={14} />
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label || (
          <em style={{ color: theme.color.sidebarTextMuted }}>untitled</em>
        )}
      </div>
      <InlineConfirm
        ariaLabel={`remove ${label || "item"}`}
        onConfirm={() => {
          setResumeBothLocales((r) => withItemRemoved(r, section.id, item.id));
          if (
            selection.kind === "item" &&
            selection.sectionId === section.id &&
            selection.itemId === item.id
          ) {
            useStore.getState().selectNone();
          }
        }}
        trigger={({ onClick }) => (
          <button
            type="button"
            onClick={onClick}
            style={{
              ...iconBtnBase,
              color: itemSelected
                ? "rgba(255,255,255,0.85)"
                : theme.color.sidebarTextMuted,
            }}
            title="Remove item"
            aria-label={`Remove ${label}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      />
    </div>
  );
}

// -- sortable section ---------------------------------------------------

function SortableSectionBlock({ section }: { section: Section }) {
  const selection = useStore((s) => s.selection);
  const expanded = useStore((s) => s.expandedSections);
  const selectSection = useStore((s) => s.selectSection);
  const selectItem = useStore((s) => s.selectItem);
  const toggleExpanded = useStore((s) => s.toggleSectionExpanded);
  // All structural — hide toggle, section remove, item add — go to both.
  const setResumeBothLocales = useStore((s) => s.setResumeBothLocales);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: SECTION_PREFIX + section.id });

  const sectionSelected = isSelected(selection, {
    kind: "section",
    sectionId: section.id,
  });
  // Treat the section as "active" when one of its items is the current
  // selection — this surfaces the parent context without overriding the
  // bold gradient that marks the actual selection target.
  const hasSelectedChild =
    selection.kind === "item" && selection.sectionId === section.id;
  const hovered = useStore(
    (s) => s.hovered.kind === "section" && s.hovered.sectionId === section.id,
  );
  const setHovered = useStore((s) => s.setHovered);
  const clearHovered = useStore((s) => s.clearHovered);
  const isExpanded = expanded.has(section.id);

  const wrapperStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : section.hidden ? 0.55 : 1,
    borderRadius: theme.radius.md,
    borderTop: `1px solid ${theme.color.sidebarBorder}`,
    paddingTop: "1rem",
    marginTop: "1rem",
  };

  return (
    <div ref={setNodeRef} style={wrapperStyle}>
      <div
        style={sectionRowStyle(sectionSelected, hovered || hasSelectedChild)}
        onClick={() => {
          selectSection(section.id);
          toggleExpanded(section.id);
        }}
        onMouseEnter={() =>
          setHovered({ kind: "section", sectionId: section.id })
        }
        onMouseLeave={clearHovered}
      >
        <span
          {...attributes}
          {...listeners}
          style={dragHandleStyle}
          title="Drag to reorder"
          aria-label={`Drag handle for ${section.title}`}
        >
          <GripVertical size={14} />
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            minWidth: 0,
            gap: "0.25rem",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              opacity: 0.7,
              color: sectionSelected
                ? "rgba(255,255,255,0.9)"
                : theme.color.sidebarTextMuted,
            }}
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textDecoration: section.hidden ? "line-through" : "none",
            }}
          >
            {section.title}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setResumeBothLocales((r) => withSectionHiddenToggled(r, section.id));
          }}
          style={{
            ...iconBtnBase,
            // Open eye = visible in PDF → green status color.
            // Closed eye = hidden → stays muted gray.
            color: section.hidden
              ? sectionSelected
                ? "rgba(255,255,255,0.85)"
                : theme.color.sidebarTextMuted
              : "#22C55E",
          }}
          title={section.hidden ? "Show in PDF" : "Hide from PDF"}
          aria-label={
            section.hidden
              ? `Show ${section.title} in PDF`
              : `Hide ${section.title} from PDF`
          }
        >
          {section.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <InlineConfirm
          ariaLabel={`remove section ${section.title}`}
          onConfirm={() => {
            setResumeBothLocales((r) => withSectionRemoved(r, section.id));
            if (
              selection.kind === "section" &&
              selection.sectionId === section.id
            ) {
              useStore.getState().selectNone();
            }
            if (
              selection.kind === "item" &&
              selection.sectionId === section.id
            ) {
              useStore.getState().selectNone();
            }
          }}
          trigger={({ onClick }) => (
            <button
              type="button"
              onClick={onClick}
              style={{
                ...iconBtnBase,
                color: sectionSelected
                  ? "rgba(255,255,255,0.85)"
                  : theme.color.sidebarTextMuted,
              }}
              title="Remove section"
              aria-label={`Remove section ${section.title}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        />
      </div>

      {isExpanded ? (
        <>
          <SortableContext
            items={section.items.map((i) => ITEM_PREFIX + i.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.items.map((item) => (
              <SortableItemRow key={item.id} section={section} item={item} />
            ))}
          </SortableContext>
          <button
            type="button"
            onClick={() => {
              const itemId = `item-${Date.now()}`;
              setResumeBothLocales((r) => withItemAdded(r, section.id, itemId));
              selectItem(section.id, itemId);
            }}
            style={addItemButtonStyle}
          >
            <Plus size={12} />
            Add item
          </button>
        </>
      ) : null}
    </div>
  );
}

// -- main component -----------------------------------------------------

const ADDABLE_TYPES: { type: AddableSectionType; label: string }[] = [
  { type: "timeline", label: "Timeline (Experience-style)" },
  { type: "compactGrid", label: "Compact grid (Education-style)" },
  { type: "showcase", label: "Showcase (Projects-style)" },
  { type: "categorizedTags", label: "Categorized tags (Skills-style)" },
];

export function Sidebar({ resume }: { resume: Resume }) {
  const selection = useStore((s) => s.selection);
  const selectHeader = useStore((s) => s.selectHeader);
  const selectSection = useStore((s) => s.selectSection);
  // DnD reorders + add-section are structural → both locales.
  const setResumeBothLocales = useStore((s) => s.setResumeBothLocales);

  const [pickerOpen, setPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;

    if (
      activeId.startsWith(SECTION_PREFIX) &&
      overId.startsWith(SECTION_PREFIX)
    ) {
      const fromId = activeId.slice(SECTION_PREFIX.length);
      const toId = overId.slice(SECTION_PREFIX.length);
      const fromIdx = resume.sections.findIndex((s) => s.id === fromId);
      const toIdx = resume.sections.findIndex((s) => s.id === toId);
      if (fromIdx < 0 || toIdx < 0) return;
      setResumeBothLocales((r) => withSectionsReordered(r, fromIdx, toIdx));
      return;
    }

    if (activeId.startsWith(ITEM_PREFIX) && overId.startsWith(ITEM_PREFIX)) {
      const fromItemId = activeId.slice(ITEM_PREFIX.length);
      const toItemId = overId.slice(ITEM_PREFIX.length);
      const section = resume.sections.find((s) =>
        s.items.some((i) => i.id === fromItemId),
      );
      if (!section) return;
      const fromIdx = section.items.findIndex((i) => i.id === fromItemId);
      const toIdx = section.items.findIndex((i) => i.id === toItemId);
      if (fromIdx < 0 || toIdx < 0) return;
      setResumeBothLocales((r) => withItemsReordered(r, section.id, fromIdx, toIdx));
    }
  }

  function handleAddSection(type: AddableSectionType) {
    const id = `section-${Date.now()}`;
    setResumeBothLocales((r) => withSectionAdded(r, type, id));
    setPickerOpen(false);
    selectSection(id);
  }

  const headerSelected = isSelected(selection, { kind: "header" });
  const headerHovered = useStore((s) => s.hovered.kind === "header");
  const setHovered = useStore((s) => s.setHovered);
  const clearHovered = useStore((s) => s.clearHovered);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useStore((s) => s.setSidebarCollapsed);
  const setPanelCollapsed = useStore((s) => s.setPanelCollapsed);
  const sidebarWidth = useStore((s) => s.sidebarWidth);
  const setSidebarWidth = useStore((s) => s.setSidebarWidth);

  // The square button collapses BOTH the sidebar and the right form
  // panel together. The form panel still has its own button to toggle
  // only itself.
  function toggleBothPanels() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    setPanelCollapsed(next);
  }

  function startResize(e: React.MouseEvent) {
    if (sidebarCollapsed) return;
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    function onMove(ev: MouseEvent) {
      setSidebarWidth(startW + (ev.clientX - startX));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const toggleButton = (
    <button
      type="button"
      onClick={toggleBothPanels}
      style={squareToggleButtonStyle}
      title={sidebarCollapsed ? "Expand panels" : "Collapse panels"}
      aria-label={sidebarCollapsed ? "Expand panels" : "Collapse panels"}
    >
      {sidebarCollapsed ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
    </button>
  );

  if (sidebarCollapsed) {
    return (
      <aside style={asideStyle(true, sidebarWidth)}>
        <div style={topButtonRowStyle(true)}>{toggleButton}</div>
      </aside>
    );
  }

  return (
    <aside style={asideStyle(false, sidebarWidth)}>
      <div style={topButtonRowStyle(false)}>{toggleButton}</div>
      <nav style={sidebarBodyStyle}>
      <div style={{ padding: "0 0.4rem 0.95rem" }}>
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            color: theme.color.sidebarText,
            textAlign: "center",
          }}
        >
          Resume Structure
        </div>
        <div
          style={{
            fontSize: "0.78rem",
            color: theme.color.sidebarTextMuted,
            marginTop: "0.6rem",
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          Select a section or item to edit.
        </div>
      </div>
      <button
        type="button"
        onClick={selectHeader}
        onMouseEnter={() => setHovered({ kind: "header" })}
        onMouseLeave={clearHovered}
        style={{
          ...sectionRowStyle(headerSelected, headerHovered),
          width: "100%",
          border: "none",
          textAlign: "left",
          justifyContent: "flex-start",
          fontFamily: theme.font.family,
          marginTop: 0,
          gap: "0.4rem",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            color: headerSelected
              ? "rgba(255,255,255,0.9)"
              : theme.color.sidebarTextMuted,
          }}
        >
          <UserRound size={15} />
        </span>
        Header
      </button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={resume.sections.map((s) => SECTION_PREFIX + s.id)}
          strategy={verticalListSortingStrategy}
        >
          {resume.sections.map((section) => (
            <SortableSectionBlock key={section.id} section={section} />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => setPickerOpen((open) => !open)}
        style={addSectionButtonStyle}
      >
        <Plus size={14} />
        {pickerOpen ? "Cancel" : "Add section"}
      </button>

      {pickerOpen ? (
        <div style={pickerStyle}>
          {ADDABLE_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => handleAddSection(type)}
              style={pickerOptionStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.color.sidebarHoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      </nav>
      <div style={sidebarResizeHandleStyle} onMouseDown={startResize} />
    </aside>
  );
}
