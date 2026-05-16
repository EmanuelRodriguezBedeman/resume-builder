// Resume data model.
// Slice 4 introduced minimal Header + Resume. This slice extends it with the
// full discriminated union of Section + Item types per CONTEXT.md.

// -- Icons ---------------------------------------------------------------

export type IconName =
  | "mail"
  | "phone"
  | "map-pin"
  | "link"
  | "github"
  | "linkedin"
  | "bar-chart-3";

// -- Header --------------------------------------------------------------

export type HeaderItem = {
  id: string;
  icon: IconName;
  text: string;
  href?: string;
};

export type Header = {
  name: string;
  items: HeaderItem[];
};

// -- Shared sub-shapes ---------------------------------------------------

export type DescriptionBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string; leadIn?: string };

// Timeline uses a strict start + end | null ("end: null" means "Present").
export type DateRange = { start: string; end: string | null };

// Compact grid allows an optional start with an optional end (open-ended).
export type FlexibleDate = { start: string; end?: string };

// -- Per-section Items ---------------------------------------------------

export type TimelineItem = {
  id: string;
  title: string;
  subtitle: string;
  dateRange: DateRange;
  description: DescriptionBlock[];
};

export type CompactGridItem = {
  id: string;
  title: string;
  subtitle?: string;
  date?: FlexibleDate;
};

export type ShowcaseLink = {
  id: string;
  icon: IconName;
  label: string;
  href?: string;
};

export type ShowcaseItem = {
  id: string;
  title: string;
  techStack: string[];
  description: DescriptionBlock[];
  links: ShowcaseLink[];
};

export type CategorizedTagsItem = {
  id: string;
  category: string;
  tags: string[];
};

// -- Section discriminated union -----------------------------------------

type SectionBase = {
  id: string;
  title: string;
  hidden: boolean;
};

export type TimelineSection = SectionBase & {
  type: "timeline";
  items: TimelineItem[];
};

export type CompactGridSection = SectionBase & {
  type: "compactGrid";
  items: CompactGridItem[];
};

export type ShowcaseSection = SectionBase & {
  type: "showcase";
  items: ShowcaseItem[];
};

export type CategorizedTagsSection = SectionBase & {
  type: "categorizedTags";
  items: CategorizedTagsItem[];
};

export type Section =
  | TimelineSection
  | CompactGridSection
  | ShowcaseSection
  | CategorizedTagsSection;

// -- Root ----------------------------------------------------------------

export type Resume = {
  schemaVersion: number;
  header: Header;
  sections: Section[];
};
