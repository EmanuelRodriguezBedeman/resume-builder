import type { CSSProperties } from "react";
import type {
  ShowcaseItem,
  ShowcaseSection as ShowcaseSectionType,
} from "../../types.ts";
import { DescriptionBlocks } from "../DescriptionBlocks.tsx";
import { SectionHeading } from "../SectionHeading.tsx";
import { Icon } from "../icons.tsx";

const MUTED = "#555";

const sectionStyle: CSSProperties = {
  marginBottom: "22pt",
};

const itemStyle: CSSProperties = {
  marginBottom: "24pt",
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
  fontSize: "11pt",
};

const techStackStyle: CSSProperties = {
  fontFamily: "Helvetica-Oblique, Helvetica, Arial, sans-serif",
  fontStyle: "italic",
  fontSize: "8.5pt",
  color: MUTED,
  marginLeft: "4pt",
};

const linksStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: "6pt",
};

const linkStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  marginRight: "18pt",
  marginTop: "2pt",
};

const linkIconStyle: CSSProperties = {
  marginRight: "5pt",
  display: "inline-flex",
  alignItems: "center",
};

const linkLabelStyle: CSSProperties = {
  fontFamily: "Helvetica-Bold, Helvetica, Arial, sans-serif",
  fontWeight: 700,
  fontSize: "9.5pt",
  color: "#000",
  textDecoration: "none",
};

function ProjectItem({ item }: { item: ShowcaseItem }) {
  return (
    <div style={itemStyle}>
      <div style={headRowStyle}>
        <span style={titleStyle}>{item.title}</span>
        <span style={techStackStyle}>[{item.techStack.join(", ")}]</span>
      </div>
      <DescriptionBlocks blocks={item.description} />
      {item.links.length > 0 ? (
        <div style={linksStyle}>
          {item.links.map((link) => (
            <div key={link.id} style={linkStyle}>
              <span style={linkIconStyle}>
                <Icon name={link.icon} size={10} />
              </span>
              {link.href ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  style={linkLabelStyle}
                >
                  {link.label}
                </a>
              ) : (
                <span style={linkLabelStyle}>{link.label}</span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ShowcaseSection({
  section,
}: {
  section: ShowcaseSectionType;
}) {
  return (
    <div style={sectionStyle}>
      <SectionHeading title={section.title} />
      {section.items.map((item) => (
        <ProjectItem key={item.id} item={item} />
      ))}
    </div>
  );
}
