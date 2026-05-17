import type { CSSProperties } from "react";
import type { Resume } from "../types.ts";
import { useStore } from "../store.ts";
import { HeaderForm } from "./forms/HeaderForm.tsx";
import { ItemForm, SectionForm } from "./forms/ItemForms.tsx";

const panelStyle: CSSProperties = {
  width: "340px",
  flexShrink: 0,
  height: "100%",
  overflowY: "auto",
  background: "#ffffff",
  borderRight: "1px solid #d0d0d0",
  padding: "1rem",
  boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif",
};

const emptyStyle: CSSProperties = {
  color: "#888",
  fontSize: "0.9rem",
};

export function FormPanel({ resume }: { resume: Resume }) {
  const selection = useStore((s) => s.selection);

  if (selection.kind === "header") {
    return (
      <aside style={panelStyle}>
        <HeaderForm resume={resume} />
      </aside>
    );
  }

  if (selection.kind === "section") {
    const section = resume.sections.find((s) => s.id === selection.sectionId);
    if (!section) {
      return (
        <aside style={panelStyle}>
          <p style={emptyStyle}>Section not found.</p>
        </aside>
      );
    }
    return (
      <aside style={panelStyle}>
        <SectionForm section={section} />
      </aside>
    );
  }

  if (selection.kind === "item") {
    return (
      <aside style={panelStyle}>
        <ItemForm
          resume={resume}
          sectionId={selection.sectionId}
          itemId={selection.itemId}
        />
      </aside>
    );
  }

  return (
    <aside style={panelStyle}>
      <p style={emptyStyle}>
        Select an item from the sidebar to edit it.
      </p>
    </aside>
  );
}
