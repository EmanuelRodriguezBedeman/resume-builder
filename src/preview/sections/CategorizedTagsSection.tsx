import { memo, useEffect, useRef, type CSSProperties } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../store.ts";
import { SectionHeading } from "../SectionHeading.tsx";
import { previewHoverStyle } from "../hoverHighlight.ts";

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

export const CategorizedTagsSection = memo(function CategorizedTagsSection({
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
      if (!section || section.type !== "categorizedTags") return [];
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
        <CategorizedTagsItem key={id} sectionId={sectionId} itemId={id} />
      ))}
    </div>
  );
});

const CategorizedTagsItem = memo(function CategorizedTagsItem({
  sectionId,
  itemId,
}: {
  sectionId: string;
  itemId: string;
}) {
  const item = useStore((s) => {
    if (s.state.status !== "loaded") return null;
    const section = s.state.resume.sections.find((sec) => sec.id === sectionId);
    if (!section || section.type !== "categorizedTags") return null;
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
      style={highlighted ? { ...rowStyle, ...previewHoverStyle } : rowStyle}
    >
      <div style={categoryColStyle}>
        <span style={categoryStyle}>{item.category}:</span>
      </div>
      <div style={tagsColStyle}>
        <span style={tagsStyle}>{item.tags.join(", ")}</span>
      </div>
    </div>
  );
});
