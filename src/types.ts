// Minimal Resume types for Slice 4 (tracer: Header end-to-end).
// The full discriminated union for Section + Item lands in the next slice.

export type IconName =
  | "mail"
  | "phone"
  | "map-pin"
  | "link"
  | "github"
  | "linkedin";

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

export type Resume = {
  schemaVersion: number;
  header: Header;
  // Refined to a discriminated union in the next slice.
  sections: unknown[];
};
