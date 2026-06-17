import { memo, useEffect, useRef, type CSSProperties } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../store.ts";
import { SectionHeading } from "../SectionHeading.tsx";
import { previewHoverStyle } from "../hoverHighlight.ts";
import { sectionById, usePreviewSource } from "../previewSource.tsx";

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
  const override = usePreviewSource();
  const storeTitle = useStore((s) => {
    if (s.state.status !== "loaded") return "";
    const section = s.state.locales[s.activeLocale].sections.find((sec) => sec.id === sectionId);
    return section?.title ?? "";
  });
  const storeItemIds = useStore(
    useShallow((s) => {
      if (s.state.status !== "loaded") return [];
      const section = s.state.locales[s.activeLocale].sections.find(
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
    if (!override && isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected, override]);
  const section = override ? sectionById(override.resume, sectionId) : undefined;
  const title = override ? section?.title ?? "" : storeTitle;
  const itemIds = override
    ? section?.type === "categorizedTags"
      ? section.items.map((i) => i.id)
      : []
    : storeItemIds;
  const highlighted = !override && (isHovered || isSelected);
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
  const override = usePreviewSource();
  const storeItem = useStore((s) => {
    if (s.state.status !== "loaded") return null;
    const section = s.state.locales[s.activeLocale].sections.find((sec) => sec.id === sectionId);
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
    if (!override && isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected, override]);
  let item = storeItem;
  if (override) {
    const section = sectionById(override.resume, sectionId);
    item =
      section?.type === "categorizedTags"
        ? section.items.find((i) => i.id === itemId) ?? null
        : null;
  }
  if (!item) return null;
  const highlighted = !override && (isHovered || isSelected);
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
