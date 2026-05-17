import { useState, type CSSProperties } from "react";
import type { Resume, Section } from "../types.ts";
import { useStore, type Selection } from "../store.ts";
import {
  withSectionAdded,
  withSectionRemoved,
  type AddableSectionType,
} from "../updaters.ts";

// Extract a display label per item depending on the section type.
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
});

const chevronStyle: CSSProperties = {
  display: "inline-block",
  width: "0.85rem",
  marginRight: "0.25rem",
  textAlign: "center",
  fontSize: "0.7rem",
  color: "#555",
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

// -- component ----------------------------------------------------------

const ADDABLE_TYPES: { type: AddableSectionType; label: string }[] = [
  { type: "timeline", label: "Timeline (Experience-style)" },
  { type: "compactGrid", label: "Compact grid (Education-style)" },
  { type: "showcase", label: "Showcase (Projects-style)" },
  { type: "categorizedTags", label: "Categorized tags (Skills-style)" },
];

export function Sidebar({ resume }: { resume: Resume }) {
  const selection = useStore((s) => s.selection);
  const expanded = useStore((s) => s.expandedSections);
  const selectHeader = useStore((s) => s.selectHeader);
  const selectSection = useStore((s) => s.selectSection);
  const selectItem = useStore((s) => s.selectItem);
  const toggleExpanded = useStore((s) => s.toggleSectionExpanded);
  const setResume = useStore((s) => s.setResume);

  const [pickerOpen, setPickerOpen] = useState(false);

  function handleAddSection(type: AddableSectionType) {
    const id = `section-${Date.now()}`;
    setResume((r) => withSectionAdded(r, type, id));
    setPickerOpen(false);
    selectSection(id);
  }

  function handleRemoveSection(section: Section) {
    const confirmed = window.confirm(
      `Remove section "${section.title}" and all its items? This cannot be undone via the UI (revert with git checkout data/resume.json).`,
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

      {resume.sections.map((section) => {
        const isExpanded = expanded.has(section.id);
        const sectionSelected = isSelected(selection, {
          kind: "section",
          sectionId: section.id,
        });
        return (
          <div key={section.id}>
            <div style={sectionRowStyle(sectionSelected)}>
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
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {section.title}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSection(section);
                }}
                style={deleteButtonStyle}
                title="Remove section"
                aria-label={`Remove section ${section.title}`}
              >
                ×
              </button>
            </div>
            {isExpanded
              ? section.items.map((item) => {
                  const itemSelected = isSelected(selection, {
                    kind: "item",
                    sectionId: section.id,
                    itemId: item.id,
                  });
                  return (
                    <div
                      key={item.id}
                      style={itemRowStyle(itemSelected)}
                      onClick={() => selectItem(section.id, item.id)}
                    >
                      {itemLabel(section, item.id)}
                    </div>
                  );
                })
              : null}
          </div>
        );
      })}

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
