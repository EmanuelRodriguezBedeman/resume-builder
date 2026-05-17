import type { CSSProperties } from "react";
import type { CompactGridSection as CompactGridSectionType } from "../../types.ts";
import { SectionHeading } from "../SectionHeading.tsx";
import { formatFlexibleDate } from "../../pdf/format.ts";

const DATE_COLOR = "#555";
const SUBTITLE_COLOR = "#333";

const sectionStyle: CSSProperties = {
  marginBottom: "22pt",
};

const gridStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
};

const cellStyle: CSSProperties = {
  width: "50%",
  paddingRight: "10pt",
  marginBottom: "14pt",
  boxSizing: "border-box",
};

const headRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "baseline",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  fontFamily: "Helvetica-Bold, Helvetica, Arial, sans-serif",
  fontWeight: 700,
  fontSize: "10pt",
};

const dateStyle: CSSProperties = {
  fontFamily: "Helvetica-Oblique, Helvetica, Arial, sans-serif",
  fontStyle: "italic",
  fontSize: "8.5pt",
  color: DATE_COLOR,
  marginLeft: "4pt",
};

const subtitleStyle: CSSProperties = {
  fontFamily: "Helvetica-Bold, Helvetica, Arial, sans-serif",
  fontWeight: 700,
  fontSize: "8.5pt",
  letterSpacing: "0.5pt",
  color: SUBTITLE_COLOR,
  marginTop: "2pt",
};

export function CompactGridSection({
  section,
}: {
  section: CompactGridSectionType;
}) {
  return (
    <div style={sectionStyle}>
      <SectionHeading title={section.title} />
      <div style={gridStyle}>
        {section.items.map((item) => (
          <div key={item.id} style={cellStyle}>
            <div style={headRowStyle}>
              <span style={titleStyle}>{item.title}</span>
              {item.date ? (
                <span style={dateStyle}>[{formatFlexibleDate(item.date)}]</span>
              ) : null}
            </div>
            {item.subtitle ? (
              <div style={subtitleStyle}>{item.subtitle}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
