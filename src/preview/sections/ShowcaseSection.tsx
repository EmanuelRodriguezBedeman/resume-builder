import { memo, useEffect, useRef, type CSSProperties } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../store.ts";
import { DescriptionBlocks } from "../DescriptionBlocks.tsx";
import { SectionHeading } from "../SectionHeading.tsx";
import { Icon } from "../icons.tsx";
import { previewHoverStyle } from "../hoverHighlight.ts";

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

export const ShowcaseSection = memo(function ShowcaseSection({
  sectionId,
}: {
  sectionId: string;
}) {
  const title = useStore((s) => {
    if (s.state.status !== "loaded") return "";
    const section = s.state.resume.sections.find((sec) => sec.id === sectionId);
    return section?.title ?? "";
  });
  const itemIds = useStore(
    useShallow((s) => {
      if (s.state.status !== "loaded") return [];
      const section = s.state.resume.sections.find(
        (sec) => sec.id === sectionId,
      );
      if (!section || section.type !== "showcase") return [];
      return section.items.map((i) => i.id);
    }),
  );
  const isHovered = useStore(
    (s) => s.hovered.kind === "section" && s.hovered.sectionId === sectionId,
  );
  const isSelected = useStore(
    (s) =>
      s.selection.kind === "section" && s.selection.sectionId === sectionId,
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);
  const highlighted = isHovered || isSelected;
  return (
    <div
      ref={ref}
      style={highlighted ? { ...sectionStyle, ...previewHoverStyle } : sectionStyle}
    >
      <SectionHeading title={title} />
      {itemIds.map((id) => (
        <ShowcaseItem key={id} sectionId={sectionId} itemId={id} />
      ))}
    </div>
  );
});

const ShowcaseItem = memo(function ShowcaseItem({
  sectionId,
  itemId,
}: {
  sectionId: string;
  itemId: string;
}) {
  const item = useStore((s) => {
    if (s.state.status !== "loaded") return null;
    const section = s.state.resume.sections.find((sec) => sec.id === sectionId);
    if (!section || section.type !== "showcase") return null;
    return section.items.find((i) => i.id === itemId) ?? null;
  });
  const isHovered = useStore(
    (s) =>
      s.hovered.kind === "item" &&
      s.hovered.sectionId === sectionId &&
      s.hovered.itemId === itemId,
  );
  const isSelected = useStore(
    (s) =>
      s.selection.kind === "item" &&
      s.selection.sectionId === sectionId &&
      s.selection.itemId === itemId,
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);
  if (!item) return null;
  const highlighted = isHovered || isSelected;
  return (
    <div
      ref={ref}
      style={highlighted ? { ...itemStyle, ...previewHoverStyle } : itemStyle}
    >
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
});
