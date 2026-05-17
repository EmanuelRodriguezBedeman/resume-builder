import type { CSSProperties } from "react";

const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-end",
  marginTop: "4pt",
  marginBottom: "14pt",
};

const titleStyle: CSSProperties = {
  fontFamily: "Helvetica-Bold, Helvetica, Arial, sans-serif",
  fontWeight: 700,
  fontSize: "16pt",
};

const ruleStyle: CSSProperties = {
  flex: 1,
  height: "1pt",
  background: "#000",
  marginLeft: "6pt",
  marginBottom: "3pt",
};

export function SectionHeading({ title }: { title: string }) {
  return (
    <div style={rowStyle}>
      <span style={titleStyle}>{title}</span>
      <div style={ruleStyle} />
    </div>
  );
}
