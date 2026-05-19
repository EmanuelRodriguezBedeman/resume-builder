import { useEffect, useState, type CSSProperties } from "react";
import { pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import { AlertTriangle, Download, FileText } from "lucide-react";
import { Resume } from "./pdf/Resume.tsx";
import { HtmlPreview } from "./preview/HtmlPreview.tsx";
import { FormPanel } from "./components/FormPanel.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { useStore, type LocalesBundle } from "./store.ts";
import { theme } from "./theme.ts";
import type { Locale } from "./save.ts";
import type { Resume as ResumeType } from "./types.ts";

function slugifyName(name: string): string {
  return name.trim().replace(/\s+/g, "_") || "resume";
}

const toolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.65rem 1.25rem",
  borderBottom: `1px solid ${theme.color.toolbarBorder}`,
  background: `${theme.color.toolbarWave}, ${theme.color.toolbarGradient}`,
  backgroundSize: "240px 40px, auto",
  backgroundRepeat: "repeat-x, no-repeat",
  fontFamily: theme.font.family,
  fontSize: "0.875rem",
  color: theme.color.toolbarText,
};

const brandStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.55rem",
  color: theme.color.toolbarText,
};

const brandTextStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  lineHeight: 1.15,
};

const brandTitleStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: "0.95rem",
};

const brandSubtitleStyle: CSSProperties = {
  fontSize: "0.66rem",
  fontWeight: 500,
  color: "rgba(255, 255, 255, 0.65)",
  letterSpacing: "0.25px",
  marginTop: "1px",
};

const brandIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: theme.radius.sm,
  background: "rgba(255, 255, 255, 0.18)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  color: "#fff",
  backdropFilter: "blur(2px)",
};

const toolbarRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
};

const localeToggleStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px",
  borderRadius: theme.radius.sm,
  background: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(255, 255, 255, 0.20)",
  fontFamily: theme.font.family,
};

const localeButtonBaseStyle: CSSProperties = {
  minWidth: "34px",
  padding: "0.32rem 0.55rem",
  borderRadius: "4px",
  border: "none",
  background: "transparent",
  color: "rgba(255, 255, 255, 0.65)",
  fontFamily: theme.font.family,
  fontWeight: 700,
  fontSize: "0.72rem",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  cursor: "pointer",
};

const localeButtonActiveStyle: CSSProperties = {
  ...localeButtonBaseStyle,
  background: theme.color.primary,
  color: "#FFFFFF",
  boxShadow: "0 1px 0 rgba(0, 0, 0, 0.25)",
};

const gradientButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  padding: "0.6rem 1.4rem",
  borderRadius: theme.radius.pill,
  border: "1px solid rgba(255, 255, 255, 0.35)",
  background: theme.color.primaryGradient,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.9rem",
  letterSpacing: "0.2px",
  textDecoration: "none",
  cursor: "pointer",
  boxShadow: theme.color.primaryGradientShadow,
  fontFamily: theme.font.family,
};

const loadingScreenStyle: CSSProperties = {
  padding: "2rem",
  fontFamily: theme.font.family,
  color: theme.color.textMuted,
};

const toastStyle: CSSProperties = {
  position: "fixed",
  bottom: "1.5rem",
  right: "1.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.75rem 1.1rem",
  borderRadius: theme.radius.card,
  background: theme.color.panelCardBg,
  border: `1px solid ${theme.color.danger}`,
  color: theme.color.danger,
  fontSize: "0.82rem",
  fontFamily: theme.font.family,
  fontWeight: 500,
  zIndex: 9999,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
  pointerEvents: "none",
};

type Envelope = { schemaVersion: number; locales: LocalesBundle };

export function App() {
  const state = useStore((s) => s.state);
  const activeLocale = useStore((s) => s.activeLocale);
  const setLoaded = useStore((s) => s.setLoaded);
  const setError = useStore((s) => s.setError);

  useEffect(() => {
    fetch("/resume")
      .then((r) => r.json() as Promise<Envelope>)
      .then((data) => setLoaded(data.locales))
      .catch((err: unknown) => setError(String(err)));
  }, [setLoaded, setError]);

  if (state.status === "error") {
    return (
      <main style={loadingScreenStyle}>
        <h1>Error loading resume</h1>
        <pre>{state.error}</pre>
      </main>
    );
  }

  if (state.status === "loading") {
    return <main style={loadingScreenStyle}>Loading…</main>;
  }

  return <LoadedApp resume={state.locales[activeLocale]} locales={state.locales} />;
}

async function buildZip(locales: LocalesBundle): Promise<Blob> {
  const [enBlob, esBlob] = await Promise.all([
    pdf(<Resume resume={locales.en} locale="en" />).toBlob(),
    pdf(<Resume resume={locales.es} locale="es" />).toBlob(),
  ]);
  const slug = slugifyName(locales.en.header.name);
  const zip = new JSZip();
  zip.file(`${slug}.pdf`, enBlob);
  zip.file(`${slug}_es.pdf`, esBlob);
  return zip.generateAsync({ type: "blob" });
}

function ExportButton({ locales }: { locales: LocalesBundle }) {
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");

  const onClick = async () => {
    if (status === "generating") return;
    setStatus("generating");
    try {
      const blob = await buildZip(locales);
      const url = URL.createObjectURL(blob);
      const slug = slugifyName(locales.en.header.name);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}_resumes.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch (err) {
      console.error("Export failed:", err);
      setStatus("error");
    }
  };

  const label =
    status === "generating"
      ? "Generating…"
      : status === "error"
        ? "Export failed"
        : "Export PDF";

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={status === "generating"}
      title="Download both English and Spanish"
      style={{
        ...gradientButtonStyle,
        opacity: status === "generating" ? 0.7 : 1,
        cursor: status === "generating" ? "wait" : "pointer",
      }}
    >
      <Download size={14} strokeWidth={2.5} />
      {label}
    </button>
  );
}

function TranslationErrorToast() {
  const msg = useStore((s) => s.translationErrorMsg);
  const setMsg = useStore((s) => s.setTranslationErrorMsg);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg, setMsg]);

  if (!msg) return null;
  return (
    <div style={toastStyle} role="alert" aria-live="assertive">
      <AlertTriangle size={14} strokeWidth={2} />
      {msg}
    </div>
  );
}

function LocaleToggle() {
  const activeLocale = useStore((s) => s.activeLocale);
  const setActiveLocale = useStore((s) => s.setActiveLocale);
  const locales: Locale[] = ["en", "es"];
  return (
    <div style={localeToggleStyle} role="group" aria-label="Active locale">
      {locales.map((loc) => {
        const isActive = loc === activeLocale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => setActiveLocale(loc)}
            aria-pressed={isActive}
            style={isActive ? localeButtonActiveStyle : localeButtonBaseStyle}
          >
            {loc.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function LoadedApp({
  resume,
  locales,
}: {
  resume: ResumeType;
  locales: LocalesBundle;
}) {
  // HtmlPreview self-subscribes to the store, so it doesn't receive
  // `resume` here. The PDF documents are only realized on Export click,
  // so this component just hands `locales` to the Export button.
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TranslationErrorToast />
      <div style={toolbarStyle}>
        <span style={brandStyle}>
          <span style={brandIconStyle}>
            <FileText size={16} strokeWidth={2.5} />
          </span>
          <span style={brandTextStyle}>
            <span style={brandTitleStyle}>Resume Builder</span>
            <span style={brandSubtitleStyle}>
              © 2026 Emanuel Rodriguez Bedeman
            </span>
          </span>
        </span>
        <div style={toolbarRightStyle}>
          <LocaleToggle />
          <ExportButton locales={locales} />
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Sidebar resume={resume} />
        <FormPanel resume={resume} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <HtmlPreview />
        </div>
      </div>
    </div>
  );
}
