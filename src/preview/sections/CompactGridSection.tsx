import { memo, useEffect, useRef, type CSSProperties } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../store.ts";
import { SectionHeading } from "../SectionHeading.tsx";
import { previewHoverStyle } from "../hoverHighlight.ts";
import { sectionById, usePreviewSource } from "../previewSource.tsx";
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

export const CompactGridSection = memo(function CompactGridSection({
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
      if (!section || section.type !== "compactGrid") return [];
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
    ? section?.type === "compactGrid"
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
      <div style={gridStyle}>
        {itemIds.map((id) => (
          <CompactGridItem key={id} sectionId={sectionId} itemId={id} />
        ))}
      </div>
    </div>
  );
});

const CompactGridItem = memo(function CompactGridItem({
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
    if (!section || section.type !== "compactGrid") return null;
    return section.items.find((i) => i.id === itemId) ?? null;
  });
  const storeLocale = useStore((s) => s.activeLocale);
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
  const locale = override ? override.locale : storeLocale;
  let item = storeItem;
  if (override) {
    const section = sectionById(override.resume, sectionId);
    item =
      section?.type === "compactGrid"
        ? section.items.find((i) => i.id === itemId) ?? null
        : null;
  }
  if (!item) return null;
  const highlighted = !override && (isHovered || isSelected);
  return (
    <div
      ref={ref}
      style={highlighted ? { ...cellStyle, ...previewHoverStyle } : cellStyle}
    >
      <div style={headRowStyle}>
        <span style={titleStyle}>{item.title}</span>
        {item.date ? (
          <span style={dateStyle}>[{formatFlexibleDate(item.date, locale)}]</span>
        ) : null}
      </div>
      {item.subtitle ? (
        <div style={subtitleStyle}>{item.subtitle}</div>
      ) : null}
    </div>
  );
});
