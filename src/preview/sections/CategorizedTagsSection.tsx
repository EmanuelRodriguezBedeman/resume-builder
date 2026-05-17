import type { CSSProperties } from "react";
import type { CategorizedTagsSection as CategorizedTagsSectionType } from "../../types.ts";
import { SectionHeading } from "../SectionHeading.tsx";

const BODY_COLOR = "#333";

const sectionStyle: CSSProperties = {
  marginBottom: "22pt",
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: "9pt",
};

const categoryColStyle: CSSProperties = {
  width: "90pt",
  flexShrink: 0,
};

const categoryStyle: CSSProperties = {
  fontFamily: "Helvetica-Bold, Helvetica, Arial, sans-serif",
  fontWeight: 700,
  fontSize: "9.5pt",
};

const tagsColStyle: CSSProperties = {
  flex: 1,
};

const tagsStyle: CSSProperties = {
  fontSize: "9.5pt",
  lineHeight: 1.4,
  color: BODY_COLOR,
};

export function CategorizedTagsSection({
  section,
}: {
  section: CategorizedTagsSectionType;
}) {
  return (
    <div style={sectionStyle}>
      <SectionHeading title={section.title} />
      {section.items.map((item) => (
        <div key={item.id} style={rowStyle}>
          <div style={categoryColStyle}>
            <span style={categoryStyle}>{item.category}:</span>
          </div>
          <div style={tagsColStyle}>
            <span style={tagsStyle}>{item.tags.join(", ")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
