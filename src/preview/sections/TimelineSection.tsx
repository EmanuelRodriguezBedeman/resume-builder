import type { CSSProperties } from "react";
import type { TimelineSection as TimelineSectionType } from "../../types.ts";
import { DescriptionBlocks } from "../DescriptionBlocks.tsx";
import { SectionHeading } from "../SectionHeading.tsx";
import { formatDateRange } from "../../pdf/format.ts";

const DATE_COLOR = "#555";
const SUBTITLE_COLOR = "#333";

const sectionStyle: CSSProperties = {
  marginBottom: "22pt",
};

const itemStyle: CSSProperties = {
  marginBottom: "18pt",
};

const headRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "baseline",
};

const titleStyle: CSSProperties = {
  fontFamily: "Helvetica-Bold, Helvetica, Arial, sans-serif",
  fontWeight: 700,
  fontSize: "11pt",
};

const dateStyle: CSSProperties = {
  fontFamily: "Helvetica-Oblique, Helvetica, Arial, sans-serif",
  fontStyle: "italic",
  fontSize: "9pt",
  color: DATE_COLOR,
};

const subtitleStyle: CSSProperties = {
  fontFamily: "Helvetica-Bold, Helvetica, Arial, sans-serif",
  fontWeight: 700,
  fontSize: "8.5pt",
  letterSpacing: "0.5pt",
  color: SUBTITLE_COLOR,
  marginTop: "2pt",
};

export function TimelineSection({
  section,
}: {
  section: TimelineSectionType;
}) {
  return (
    <div style={sectionStyle}>
      <SectionHeading title={section.title} />
      {section.items.map((item) => (
        <div key={item.id} style={itemStyle}>
          <div style={headRowStyle}>
            <span style={titleStyle}>{item.title}</span>
            <span style={dateStyle}>{formatDateRange(item.dateRange)}</span>
          </div>
          <div style={subtitleStyle}>{item.subtitle}</div>
          <DescriptionBlocks blocks={item.description} />
        </div>
      ))}
    </div>
  );
}
