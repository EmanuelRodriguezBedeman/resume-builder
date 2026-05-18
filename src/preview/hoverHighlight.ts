import type { CSSProperties } from "react";

// Outline applied to a preview block when the matching sidebar row is
// being hovered. Uses `outline` (not `border`) so the highlight sits
// outside the element box and doesn't shift sibling content. If the
// block is scrolled off-viewport it simply isn't visible — by design,
// no auto-scroll.
export const previewHoverStyle: CSSProperties = {
  outline: "2px solid rgba(91, 79, 229, 0.7)",
  outlineOffset: "4px",
  borderRadius: "3px",
};
