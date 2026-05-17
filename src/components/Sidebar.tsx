import type React from "react";
import type { Resume, Section } from "../types.ts";
import { useStore, type Selection } from "../store.ts";

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

const rowStyle = (selected: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  padding: "0.35rem 0.5rem",
  borderRadius: "4px",
  cursor: "pointer",
  background: selected ? "#e6f0ff" : "transparent",
  color: selected ? "#0b4cb1" : "#1a1a1a",
  fontWeight: selected ? 600 : 400,
  userSelect: "none",
});

const sectionRowStyle = (selected: boolean): React.CSSProperties => ({
  ...rowStyle(selected),
  marginTop: "0.25rem",
  fontSize: "0.92rem",
  fontWeight: selected ? 700 : 600,
});

const itemRowStyle = (selected: boolean): React.CSSProperties => ({
  ...rowStyle(selected),
  marginLeft: "1.5rem",
  fontSize: "0.85rem",
});

const chevronStyle: React.CSSProperties = {
  display: "inline-block",
  width: "0.85rem",
  marginRight: "0.25rem",
  textAlign: "center",
  fontSize: "0.7rem",
  color: "#555",
};

export function Sidebar({ resume }: { resume: Resume }) {
  const selection = useStore((s) => s.selection);
  const expanded = useStore((s) => s.expandedSections);
  const selectHeader = useStore((s) => s.selectHeader);
  const selectSection = useStore((s) => s.selectSection);
  const selectItem = useStore((s) => s.selectItem);
  const toggleExpanded = useStore((s) => s.toggleSectionExpanded);

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
          background: isSelected(selection, { kind: "header" })
            ? "#e6f0ff"
            : "transparent",
          textAlign: "left",
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
            <div
              style={sectionRowStyle(sectionSelected)}
              onClick={() => {
                selectSection(section.id);
                toggleExpanded(section.id);
              }}
            >
              <span style={chevronStyle}>{isExpanded ? "▾" : "▸"}</span>
              {section.title}
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
    </nav>
  );
}
