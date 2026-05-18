import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Resume } from "../types.ts";
import { useStore } from "../store.ts";
import { theme } from "../theme.ts";
import { HeaderForm } from "./forms/HeaderForm.tsx";
import { ItemForm, SectionForm } from "./forms/ItemForms.tsx";

// -- Styles -------------------------------------------------------------

const RAIL_WIDTH = 36;
const PANEL_WIDTH = 380;

const asideStyle = (collapsed: boolean): CSSProperties => ({
  display: "flex",
  flexDirection: "row",
  width: collapsed ? `${RAIL_WIDTH}px` : `${PANEL_WIDTH}px`,
  flexShrink: 0,
  height: "100%",
  background: theme.color.panelBg,
  borderRight: `1px solid ${theme.color.panelBorder}`,
  boxSizing: "border-box",
  fontFamily: theme.font.family,
  color: theme.color.panelText,
  // Stacking context above the preview so the overhanging round toggle
  // button is not covered by the preview background.
  position: "relative",
  zIndex: 1,
});

const bodyStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: "100%",
  overflowY: "auto",
  padding: "1.2rem 1.25rem 1.4rem",
  boxSizing: "border-box",
};

const railStyle: CSSProperties = {
  width: `${RAIL_WIDTH}px`,
  flexShrink: 0,
  height: "100%",
  position: "relative",
};

const roundButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  // Anchor the button center to the panel's right edge — half inside the
  // panel, half overhanging onto the preview area.
  right: 0,
  transform: "translate(50%, -50%)",
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  background: theme.color.panelCardBg,
  border: `1px solid rgba(255, 255, 255, 0.18)`,
  color: theme.color.panelText,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
};

const emptyStyle: CSSProperties = {
  color: theme.color.panelTextMuted,
  fontSize: "0.9rem",
  lineHeight: 1.5,
};

// -- Component ----------------------------------------------------------

export function FormPanel({ resume }: { resume: Resume }) {
  const selection = useStore((s) => s.selection);
  const panelCollapsed = useStore((s) => s.panelCollapsed);
  const togglePanelCollapsed = useStore((s) => s.togglePanelCollapsed);

  return (
    <aside style={asideStyle(panelCollapsed)}>
      {!panelCollapsed ? (
        <div style={bodyStyle}>{renderBody(resume, selection)}</div>
      ) : null}
      <div style={railStyle}>
        <button
          type="button"
          onClick={togglePanelCollapsed}
          style={roundButtonStyle}
          title={panelCollapsed ? "Expand editor panel" : "Collapse editor panel"}
          aria-label={
            panelCollapsed ? "Expand editor panel" : "Collapse editor panel"
          }
        >
          {panelCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>
    </aside>
  );
}

function renderBody(
  resume: Resume,
  selection: ReturnType<typeof useStore.getState>["selection"],
) {
  if (selection.kind === "header") {
    return <HeaderForm resume={resume} />;
  }
  if (selection.kind === "section") {
    const section = resume.sections.find((s) => s.id === selection.sectionId);
    if (!section) return <p style={emptyStyle}>Section not found.</p>;
    return <SectionForm section={section} />;
  }
  if (selection.kind === "item") {
    return (
      <ItemForm
        resume={resume}
        sectionId={selection.sectionId}
        itemId={selection.itemId}
      />
    );
  }
  return (
    <p style={emptyStyle}>Select an item in the sidebar to start editing.</p>
  );
}
