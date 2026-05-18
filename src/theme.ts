// Shared visual tokens for the editor UI. Design language is a fusion of
// LinkedIn (#0A66C2 trusty blue) and Canva (#7C3AED vibrant violet): a
// unified indigo dark base, with blue→violet gradients on the toolbar and
// selected states for the "LinkedIn × Canva" moment.
export const theme = {
  color: {
    // Bright indigo — sits between LinkedIn blue and Canva violet. Used
    // for input focus rings, checkbox accents, etc.
    primary: "#5B4FE5",
    primaryHover: "#4338CA",

    // Export PDF button gradient — violet → pink, the Canva-style pop.
    primaryGradient:
      "linear-gradient(135deg, #8B3DFF 0%, #FF3EAE 100%)",
    // Layered shadow: pink halo + tighter violet lift + inner top highlight.
    primaryGradientShadow:
      "0 8px 24px rgba(255, 62, 174, 0.45), 0 2px 6px rgba(124, 58, 237, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.28)",

    // Sidebar — shared indigo dark base (no longer blue-only). Selection
    // pops with a blue→violet gradient (LinkedIn → Canva).
    sidebarBg: "#252850",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    sidebarText: "#F4F4F7",
    sidebarTextMuted: "#A2A6CB",
    sidebarHoverBg: "rgba(255, 255, 255, 0.06)",
    sidebarSelectedBg:
      "linear-gradient(135deg, #0A66C2 0%, #7C3AED 100%)",
    sidebarSelectedText: "#FFFFFF",

    // Light surfaces (cards on white-bg screens, if any)
    surface: "#FFFFFF",
    surfaceMuted: "#E4ECF7",
    surfaceCard: "#FAFBFC",

    // Form panel — same indigo family as the sidebar, now noticeably
    // darker so the two panels still read as distinct surfaces.
    panelBg: "#1E2042",
    panelBorder: "rgba(255, 255, 255, 0.08)",
    panelText: "#F4F4F7",
    panelTextMuted: "#A2A6CB",
    panelCardBg: "#2F3260",
    panelCardBorder: "rgba(255, 255, 255, 0.10)",
    panelInputBg: "#171830",
    panelInputBorder: "rgba(255, 255, 255, 0.08)",

    // Toolbar — LinkedIn blue → indigo → Canva violet sweep, with wave overlay.
    toolbarGradient:
      "linear-gradient(90deg, #0A66C2 0%, #4F46E5 50%, #7C3AED 100%)",
    toolbarWave:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='40' viewBox='0 0 240 40'><path d='M0 18 Q 30 6 60 18 T 120 18 T 180 18 T 240 18' fill='none' stroke='%23ffffff' stroke-opacity='0.14' stroke-width='1.5'/><path d='M0 30 Q 30 20 60 30 T 120 30 T 180 30 T 240 30' fill='none' stroke='%23ffffff' stroke-opacity='0.08' stroke-width='1'/></svg>\")",
    toolbarText: "#FFFFFF",
    toolbarBorder: "rgba(0, 0, 0, 0.18)",

    border: "#E4E4E7",
    text: "#0F0F1A",
    textMuted: "#71717A",

    danger: "#DC2626",
    dangerSoftBg: "#FEE2E2",
  },

  // Roundness — "(c) Generoso" from the grilling
  radius: {
    sm: "6px",
    input: "8px",
    md: "10px",
    card: "14px",
    pill: "22px",
  },

  font: {
    family:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },

  shadow: {
    card: "0 1px 3px rgba(15, 15, 26, 0.06)",
    elevated: "0 4px 12px rgba(15, 15, 26, 0.08)",
  },
};
