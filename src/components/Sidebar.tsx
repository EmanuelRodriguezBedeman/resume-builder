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
import type { Resume, Section } from "../types.ts";
import { useStore, type Selection } from "../store.ts";
import {
  withItemAdded,
  withItemRemoved,
  withItemsReordered,
  withSectionAdded,
  withSectionRemoved,
  withSectionsReordered,
  type AddableSectionType,
} from "../updaters.ts";

// Prefix sortable ids so sections and items live in distinct namespaces
// inside the single DndContext. This way item drags can never target
// section drop zones and vice versa.
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

const rowBase: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0.35rem 0.5rem",
  borderRadius: "4px",
  cursor: "pointer",
  userSelect: "none",
};

const sectionRowStyle = (selected: boolean): CSSProperties => ({
  ...rowBase,
  marginTop: "0.25rem",
  fontSize: "0.92rem",
  fontWeight: selected ? 700 : 600,
  background: selected ? "#e6f0ff" : "transparent",
  color: selected ? "#0b4cb1" : "#1a1a1a",
  justifyContent: "space-between",
});

const itemRowStyle = (selected: boolean): CSSProperties => ({
  ...rowBase,
  marginLeft: "1.5rem",
  fontSize: "0.85rem",
  background: selected ? "#e6f0ff" : "transparent",
  color: selected ? "#0b4cb1" : "#1a1a1a",
  fontWeight: selected ? 600 : 400,
  justifyContent: "space-between",
});

const addItemButtonStyle: CSSProperties = {
  display: "block",
  marginLeft: "1.5rem",
  marginTop: "0.2rem",
  padding: "0.2rem 0.5rem",
  fontSize: "0.78rem",
  background: "transparent",
  border: "1px dashed #aaa",
  borderRadius: "3px",
  color: "#555",
  cursor: "pointer",
};

const chevronStyle: CSSProperties = {
  display: "inline-block",
  width: "0.85rem",
  marginRight: "0.25rem",
  textAlign: "center",
  fontSize: "0.7rem",
  color: "#555",
};

const dragHandleStyle: CSSProperties = {
  display: "inline-block",
  width: "0.9rem",
  marginRight: "0.15rem",
  textAlign: "center",
  fontSize: "0.85rem",
  color: "#888",
  cursor: "grab",
  userSelect: "none",
};

const deleteButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#a52a2a",
  cursor: "pointer",
  padding: "0 0.3rem",
  fontSize: "1rem",
  lineHeight: 1,
  borderRadius: "3px",
};

const addButtonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "1rem",
  padding: "0.5rem",
  fontSize: "0.85rem",
  fontWeight: 600,
  background: "#ffffff",
  border: "1px dashed #888",
  borderRadius: "5px",
  color: "#333",
  cursor: "pointer",
};

const pickerStyle: CSSProperties = {
  marginTop: "0.5rem",
  padding: "0.5rem",
  background: "#ffffff",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

const pickerOptionStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "0.4rem 0.5rem",
  border: "none",
  background: "transparent",
  borderRadius: "3px",
  fontSize: "0.85rem",
  cursor: "pointer",
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
  const setResume = useStore((s) => s.setResume);

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

  const wrapperStyle: CSSProperties = {
    ...itemRowStyle(itemSelected),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? "#e8edf2" : itemRowStyle(itemSelected).background,
  };

  function handleRemove() {
    const confirmed = window.confirm(`Remove "${label || "untitled"}"?`);
    if (!confirmed) return;
    setResume((r) => withItemRemoved(r, section.id, item.id));
    if (
      selection.kind === "item" &&
      selection.sectionId === section.id &&
      selection.itemId === item.id
    ) {
      useStore.getState().selectNone();
    }
  }

  return (
    <div ref={setNodeRef} style={wrapperStyle}>
      <span
        {...attributes}
        {...listeners}
        style={{ ...dragHandleStyle, fontSize: "0.75rem" }}
        title="Drag to reorder"
        aria-label={`Drag handle for ${label}`}
      >
        ⋮⋮
      </span>
      <div
        onClick={() => selectItem(section.id, item.id)}
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label || <em style={{ color: "#888" }}>untitled</em>}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        style={deleteButtonStyle}
        title="Remove item"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
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
  const setResume = useStore((s) => s.setResume);

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
  const isExpanded = expanded.has(section.id);

  const wrapperStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? "#e8edf2" : "transparent",
    borderRadius: "4px",
  };

  function handleRemove() {
    const confirmed = window.confirm(
      `Remove section "${section.title}" and all its items? Revert with git checkout data/resume.json if needed.`,
    );
    if (!confirmed) return;
    setResume((r) => withSectionRemoved(r, section.id));
    if (selection.kind === "section" && selection.sectionId === section.id) {
      useStore.getState().selectNone();
    }
    if (selection.kind === "item" && selection.sectionId === section.id) {
      useStore.getState().selectNone();
    }
  }

  function handleAddItem() {
    const itemId = `item-${Date.now()}`;
    setResume((r) => withItemAdded(r, section.id, itemId));
    selectItem(section.id, itemId);
  }

  return (
    <div ref={setNodeRef} style={wrapperStyle}>
      <div style={sectionRowStyle(sectionSelected)}>
        <span
          {...attributes}
          {...listeners}
          style={dragHandleStyle}
          title="Drag to reorder"
          aria-label={`Drag handle for ${section.title}`}
        >
          ⋮⋮
        </span>
        <div
          onClick={() => {
            selectSection(section.id);
            toggleExpanded(section.id);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span style={chevronStyle}>{isExpanded ? "▾" : "▸"}</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {section.title}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          style={deleteButtonStyle}
          title="Remove section"
          aria-label={`Remove section ${section.title}`}
        >
          ×
        </button>
      </div>

      {isExpanded ? (
        <>
          <SortableContext
            items={section.items.map((i) => ITEM_PREFIX + i.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.items.map((item) => (
              <SortableItemRow
                key={item.id}
                section={section}
                item={item}
              />
            ))}
          </SortableContext>
          <button
            type="button"
            onClick={handleAddItem}
            style={addItemButtonStyle}
          >
            + Add item
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
  const setResume = useStore((s) => s.setResume);

  const [pickerOpen, setPickerOpen] = useState(false);

  // PointerSensor with a small activation distance so plain clicks on the
  // handle don't accidentally start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;

    // Section drag: both ids share the section prefix.
    if (
      activeId.startsWith(SECTION_PREFIX) &&
      overId.startsWith(SECTION_PREFIX)
    ) {
      const fromId = activeId.slice(SECTION_PREFIX.length);
      const toId = overId.slice(SECTION_PREFIX.length);
      const fromIdx = resume.sections.findIndex((s) => s.id === fromId);
      const toIdx = resume.sections.findIndex((s) => s.id === toId);
      if (fromIdx < 0 || toIdx < 0) return;
      setResume((r) => withSectionsReordered(r, fromIdx, toIdx));
      return;
    }

    // Item drag: both ids share the item prefix. Cross-section is rejected
    // here by checking that both items belong to the same parent section.
    if (activeId.startsWith(ITEM_PREFIX) && overId.startsWith(ITEM_PREFIX)) {
      const fromItemId = activeId.slice(ITEM_PREFIX.length);
      const toItemId = overId.slice(ITEM_PREFIX.length);
      const section = resume.sections.find((s) =>
        s.items.some((i) => i.id === fromItemId),
      );
      if (!section) return;
      const fromIdx = section.items.findIndex((i) => i.id === fromItemId);
      const toIdx = section.items.findIndex((i) => i.id === toItemId);
      if (fromIdx < 0 || toIdx < 0) return; // cross-section drag — no-op
      setResume((r) =>
        withItemsReordered(r, section.id, fromIdx, toIdx),
      );
    }
  }

  function handleAddSection(type: AddableSectionType) {
    const id = `section-${Date.now()}`;
    setResume((r) => withSectionAdded(r, type, id));
    setPickerOpen(false);
    selectSection(id);
  }

  return (
    <nav
      style={{
        width: "260px",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        background: "#f5f6f8",
        borderRight: "1px solid #d0d0d0",
        padding: "0.75rem 0.5rem",
        fontFamily: "system-ui, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={selectHeader}
        style={{
          ...sectionRowStyle(isSelected(selection, { kind: "header" })),
          width: "100%",
          border: "none",
          textAlign: "left",
          justifyContent: "flex-start",
        }}
      >
        <span style={chevronStyle}> </span>
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
        style={addButtonStyle}
      >
        {pickerOpen ? "Cancel" : "+ Add section"}
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
                e.currentTarget.style.background = "#eef2f6";
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
  );
}
