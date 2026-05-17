import type React from "react";
import type { Resume } from "../types.ts";
import { useStore } from "../store.ts";

const panelStyle: React.CSSProperties = {
  width: "320px",
  flexShrink: 0,
  height: "100%",
  overflowY: "auto",
  background: "#ffffff",
  borderRight: "1px solid #d0d0d0",
  padding: "1rem",
  boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  color: "#555",
  marginBottom: "0.3rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.45rem 0.6rem",
  fontSize: "0.95rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif",
};

const emptyStyle: React.CSSProperties = {
  color: "#888",
  fontSize: "0.9rem",
  paddingTop: "0.5rem",
};

function HeaderForm({ resume }: { resume: Resume }) {
  const updateHeaderName = useStore((s) => s.updateHeaderName);
  return (
    <div>
      <h2 style={{ fontSize: "1rem", margin: "0 0 1rem", fontWeight: 700 }}>
        Header
      </h2>
      <label style={labelStyle}>Name</label>
      <input
        type="text"
        value={resume.header.name}
        onChange={(e) => updateHeaderName(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

export function FormPanel({ resume }: { resume: Resume }) {
  const selection = useStore((s) => s.selection);

  if (selection.kind === "header") {
    return (
      <aside style={panelStyle}>
        <HeaderForm resume={resume} />
      </aside>
    );
  }

  return (
    <aside style={panelStyle}>
      <p style={emptyStyle}>
        Select an item from the sidebar to edit it. Full editing for every
        field type arrives in the next slice — for now only{" "}
        <strong>Header → Name</strong> is editable.
      </p>
    </aside>
  );
}
