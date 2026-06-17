import { useEffect, useRef, useState, type CSSProperties } from "react";
import { pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import { zipSync } from "fflate";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileDown,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Resume } from "./pdf/Resume.tsx";
import { HtmlPreview } from "./preview/HtmlPreview.tsx";
import { FormPanel } from "./components/FormPanel.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { JdPanel } from "./jd/JdPanel.tsx";
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

// Secondary toolbar action (Resume by JD / ← Editor). Translucent glass on
// the toolbar gradient — same treatment as the locale toggle. The Export
// gradient is reserved for the one primary action per view (design-system §9).
const toolbarButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.45rem 0.85rem",
  borderRadius: theme.radius.pill,
  background: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(255, 255, 255, 0.20)",
  color: theme.color.toolbarText,
  fontFamily: theme.font.family,
  fontWeight: 600,
  fontSize: "0.78rem",
  cursor: "pointer",
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

// Score chips are *informative*, not actionable — so they deliberately avoid
// the Export gradient (reserved for primary actions). Same translucent-glass
// treatment as the locale toggle, with the number tinted by its score tier.
const scoreChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  padding: "0.32rem 0.6rem",
  borderRadius: theme.radius.sm,
  background: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(255, 255, 255, 0.20)",
  fontFamily: theme.font.family,
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.6px",
  lineHeight: 1,
};

const scoreChipLabelStyle: CSSProperties = {
  color: "rgba(255, 255, 255, 0.65)",
  textTransform: "uppercase",
};

// ≥80 green (on/healthy), 60–79 amber (warn), <60 rose (danger token).
const scoreColor = (n: number): string =>
  n >= 80 ? "#22C55E" : n >= 60 ? "#F59E0B" : theme.color.danger;

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
  const setTranslationOverrides = useStore((s) => s.setTranslationOverrides);

  useEffect(() => {
    Promise.all([
      fetch("/resume").then((r) => r.json() as Promise<Envelope>),
      fetch("/overrides").then(
        (r) => r.json() as Promise<{ overrides: Record<string, boolean> }>,
      ),
    ])
      .then(([resumeData, overridesData]) => {
        setLoaded(resumeData.locales);
        setTranslationOverrides(
          overridesData.overrides as Record<string, boolean>,
        );
      })
      .catch((err: unknown) => setError(String(err)));
  }, [setLoaded, setError, setTranslationOverrides]);

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

// Inline rotating spinner for button loading states. Mirrors the
// requestAnimationFrame approach in components/forms/shared.tsx so the UI
// stays CSS-file-free (everything is inline styles).
function ButtonSpinner() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frameId: number;
    let startTs: number | null = null;
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const deg = (((ts - startTs) / 1000) * 360) % 360;
      if (ref.current) ref.current.style.transform = `rotate(${deg}deg)`;
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);
  return (
    <span ref={ref} style={{ display: "inline-flex" }}>
      <Loader2 size={14} strokeWidth={2.5} />
    </span>
  );
}

// Exports both locales as ATS-optimized .docx files (server-rendered via
// POST /docx) zipped together client-side with fflate. The server reads
// resume data from disk, so this button needs no locale payload.
function DocxExportButton() {
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const setTranslationErrorMsg = useStore((s) => s.setTranslationErrorMsg);

  const onClick = async () => {
    if (status === "generating") return;
    setStatus("generating");
    try {
      const [enRes, esRes] = await Promise.all([
        fetch("/docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: "en" }),
        }),
        fetch("/docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: "es" }),
        }),
      ]);
      if (!enRes.ok || !esRes.ok) {
        throw new Error(`docx request failed (${enRes.status}/${esRes.status})`);
      }
      const [enBuf, esBuf] = await Promise.all([
        enRes.arrayBuffer(),
        esRes.arrayBuffer(),
      ]);
      const zipped = zipSync({
        "resume_en.docx": new Uint8Array(enBuf),
        "resume_es.docx": new Uint8Array(esBuf),
      });
      const blob = new Blob([zipped], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX export failed:", err);
      setTranslationErrorMsg("DOCX export failed. Please try again.");
    } finally {
      setStatus("idle");
    }
  };

  const generating = status === "generating";
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={generating}
      title="Download both English and Spanish as DOCX"
      style={{
        ...gradientButtonStyle,
        opacity: generating ? 0.7 : 1,
        cursor: generating ? "wait" : "pointer",
      }}
    >
      {generating ? <ButtonSpinner /> : <FileDown size={14} strokeWidth={2.5} />}
      {generating ? "Exporting…" : "Export DOCX"}
    </button>
  );
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

// Live résumé-quality scores, one chip per locale (e.g. "EN 82 · ES 75").
// Subscribes to the store's `scores`, which every resume mutation recomputes
// synchronously — so the numbers track edits in real time, no button needed.
function ScoreChips() {
  const scores = useStore((s) => s.scores);
  const entries: Locale[] = ["en", "es"];
  return (
    <div
      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      role="group"
      aria-label="Resume quality scores"
    >
      {entries.map((loc) => (
        <span
          key={loc}
          style={scoreChipStyle}
          title={`${loc.toUpperCase()} resume quality: ${scores[loc]}/100`}
        >
          <span style={scoreChipLabelStyle}>{loc}</span>
          <span style={{ color: scoreColor(scores[loc]) }}>{scores[loc]}</span>
        </span>
      ))}
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

type View = "editor" | "jd";

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
  const [view, setView] = useState<View>("editor");

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
          {view === "editor" ? (
            <>
              <button
                type="button"
                style={toolbarButtonStyle}
                onClick={() => setView("jd")}
                title="Generate a CV tailored to a job description"
              >
                <Sparkles size={14} strokeWidth={2.5} />
                Resume by JD
              </button>
              <LocaleToggle />
              <ScoreChips />
              <DocxExportButton />
              <ExportButton locales={locales} />
            </>
          ) : (
            <button
              type="button"
              style={toolbarButtonStyle}
              onClick={() => setView("editor")}
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Editor
            </button>
          )}
        </div>
      </div>
      {view === "jd" ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <JdPanel />
        </div>
      ) : (
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
      )}
    </div>
  );
}
