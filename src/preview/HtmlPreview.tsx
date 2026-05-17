import type { CSSProperties } from "react";
import type { Resume } from "../types.ts";
import { Header } from "./Header.tsx";
import { SectionRenderer } from "./sections/index.tsx";

// A4 dimensions in PostScript points (1pt = 1/72 inch). React-PDF's page
// uses the same coordinate space, so sticking with pt for every measurement
// in the preview gives near-1:1 visual parity with the export.
const PAGE_WIDTH_PT = 595;
const PAGE_PADDING_VERT_PT = 36;
const PAGE_PADDING_HORIZ_PT = 32;

const scrollContainerStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  overflowY: "auto",
  overflowX: "auto",
  background: "#dadbdf",
  padding: "16pt 0",
  boxSizing: "border-box",
};

const pageStyle: CSSProperties = {
  width: `${PAGE_WIDTH_PT}pt`,
  minHeight: `${842 - 16}pt`, // A4 height minus the scroll-container padding
  margin: "0 auto",
  background: "#ffffff",
  boxShadow: "0 2pt 8pt rgba(0, 0, 0, 0.18)",
  paddingTop: `${PAGE_PADDING_VERT_PT}pt`,
  paddingBottom: `${PAGE_PADDING_VERT_PT}pt`,
  paddingLeft: `${PAGE_PADDING_HORIZ_PT}pt`,
  paddingRight: `${PAGE_PADDING_HORIZ_PT}pt`,
  boxSizing: "border-box",
  fontFamily: "Helvetica, Arial, sans-serif",
  fontSize: "10pt",
  color: "#000",
};

export function HtmlPreview({ resume }: { resume: Resume }) {
  return (
    <div style={scrollContainerStyle}>
      <div style={pageStyle}>
        <Header header={resume.header} />
        {resume.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
