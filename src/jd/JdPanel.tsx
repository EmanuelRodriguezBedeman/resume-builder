import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { pdf } from "@react-pdf/renderer";
import { AlertTriangle, ArrowLeft, Download, Loader2, Sparkles } from "lucide-react";
import { theme } from "../theme.ts";
import type { Locale } from "../save.ts";
import type { Resume as ResumeType } from "../types.ts";
import { Resume } from "../pdf/Resume.tsx";
import { HtmlPreview } from "../preview/HtmlPreview.tsx";
import { PreviewSourceContext } from "../preview/previewSource.tsx";

// Owner of the "jd" view. Lets the user paste a job description and generate a
// tailored CV via POST /jd/generate (backend from #22). Provider config comes
// from GET /jd/provider-status (#20): when unconfigured we show a setup nudge
// instead of the form. The full result view is #24 — for now a successful
// generation just shows a "Generation complete" placeholder.

type ProviderStatus = {
  configured: boolean;
  provider: "gemini" | null;
};

// "auto" omits locale from the request so the backend auto-detects the JD's
// language; "en"/"es" force the output locale.
type LangChoice = "auto" | Locale;

type GenStatus = "idle" | "generating" | "error";

// Maps the backend's error codes to human-readable inline messages.
const ERROR_MESSAGES: Record<string, string> = {
  provider_unconfigured: "No AI provider is configured.",
  invalid_ai_response: "The AI returned an unexpected response. Try again.",
  ai_request_failed: "The AI service is unavailable right now. Try again later.",
  missing_jd: "Paste a job description first.",
};

// -- Styles (indigo dark ladder; see docs/design-system.md §9) -----------

const viewStyle: CSSProperties = {
  height: "100%",
  overflowY: "auto",
  background: theme.color.panelBg,
  fontFamily: theme.font.family,
};

const containerStyle: CSSProperties = {
  maxWidth: "680px",
  margin: "0 auto",
  padding: "2.5rem 2rem 3rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
};

const headingStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
  margin: 0,
  fontSize: "1.35rem",
  fontWeight: 700,
  color: theme.color.panelText,
};

const subheadingStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.85rem",
  fontWeight: 500,
  lineHeight: 1.5,
  color: theme.color.panelTextMuted,
};

const labelStyle: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: theme.color.panelTextMuted,
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const textareaStyle: CSSProperties = {
  minHeight: "240px",
  resize: "vertical",
  padding: "0.85rem 1rem",
  borderRadius: theme.radius.input,
  background: theme.color.panelInputBg,
  border: "1px solid transparent",
  color: theme.color.panelText,
  fontFamily: theme.font.family,
  fontSize: "0.9rem",
  lineHeight: 1.55,
  outline: "none",
};

const segmentGroupStyle: CSSProperties = {
  display: "inline-flex",
  alignSelf: "flex-start",
  padding: "2px",
  borderRadius: theme.radius.sm,
  background: theme.color.panelCardBg,
  border: `1px solid ${theme.color.panelCardBorder}`,
};

const segmentBaseStyle: CSSProperties = {
  padding: "0.4rem 0.85rem",
  borderRadius: "4px",
  border: "none",
  background: "transparent",
  color: theme.color.panelTextMuted,
  fontFamily: theme.font.family,
  fontWeight: 600,
  fontSize: "0.78rem",
  cursor: "pointer",
};

const segmentActiveStyle: CSSProperties = {
  ...segmentBaseStyle,
  background: theme.color.primary,
  color: "#FFFFFF",
};

const generateButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  alignSelf: "flex-start",
  padding: "0.7rem 1.6rem",
  borderRadius: theme.radius.pill,
  border: "1px solid rgba(255, 255, 255, 0.35)",
  background: theme.color.primaryGradient,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.9rem",
  letterSpacing: "0.2px",
  cursor: "pointer",
  boxShadow: theme.color.primaryGradientShadow,
  fontFamily: theme.font.family,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.85rem",
  color: theme.color.panelTextMuted,
};

const errorRowStyle: CSSProperties = {
  ...statusRowStyle,
  color: theme.color.danger,
};

const nudgeCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  padding: "1.25rem 1.5rem",
  borderRadius: theme.radius.card,
  background: theme.color.panelCardBg,
  border: `1px solid ${theme.color.panelCardBorder}`,
  color: theme.color.panelTextMuted,
  fontSize: "0.88rem",
  lineHeight: 1.55,
};

const codeStyle: CSSProperties = {
  padding: "0.1rem 0.35rem",
  borderRadius: "4px",
  background: theme.color.panelInputBg,
  color: theme.color.panelText,
  fontSize: "0.82rem",
};

const LANG_OPTIONS: { value: LangChoice; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

// -- Result view styles --------------------------------------------------

const resultViewStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: theme.color.panelBg,
  fontFamily: theme.font.family,
};

const resultBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.75rem 1.25rem",
  borderBottom: `1px solid ${theme.color.panelBorder}`,
  background: theme.color.panelBg,
};

const resultTitleStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.95rem",
  fontWeight: 700,
  color: theme.color.panelText,
};

const localeChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  padding: "0.25rem 0.6rem",
  borderRadius: theme.radius.sm,
  background: theme.color.panelCardBg,
  border: `1px solid ${theme.color.panelCardBorder}`,
  color: theme.color.panelTextMuted,
  fontSize: "0.72rem",
  fontWeight: 600,
  letterSpacing: "0.3px",
};

const againButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.5rem 0.95rem",
  borderRadius: theme.radius.pill,
  background: "rgba(255, 255, 255, 0.08)",
  border: `1px solid ${theme.color.panelCardBorder}`,
  color: theme.color.panelText,
  fontFamily: theme.font.family,
  fontWeight: 600,
  fontSize: "0.78rem",
  cursor: "pointer",
};

const downloadButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  padding: "0.5rem 1.2rem",
  borderRadius: theme.radius.pill,
  border: "1px solid rgba(255, 255, 255, 0.35)",
  background: theme.color.primaryGradient,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.82rem",
  cursor: "pointer",
  boxShadow: theme.color.primaryGradientShadow,
  fontFamily: theme.font.family,
};

function slugifyName(name: string): string {
  return name.trim().replace(/\s+/g, "_") || "resume";
}

// Inline rAF-driven spinner — mirrors App.tsx's ButtonSpinner so the UI stays
// CSS-file-free (design-system §4 "Translation feedback").
function Spinner() {
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
      <Loader2 size={16} strokeWidth={2.5} />
    </span>
  );
}

export function JdPanel() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [statusError, setStatusError] = useState(false);

  const [jd, setJd] = useState("");
  const [lang, setLang] = useState<LangChoice>("auto");
  const [gen, setGen] = useState<GenStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // The generated CV lives here, in local state — NOT in the Zustand store, so
  // it never overwrites the user's real Resume (issue #24). null = show form.
  const [result, setResult] = useState<{
    resume: ResumeType;
    locale: Locale;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/jd/provider-status")
      .then((r) => r.json() as Promise<ProviderStatus>)
      .then(setStatus)
      .catch(() => setStatusError(true));
  }, []);

  const onGenerate = async () => {
    if (gen === "generating" || !jd.trim()) return;
    setGen("generating");
    setErrorMsg(null);
    try {
      const res = await fetch("/jd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd,
          ...(lang === "auto" ? {} : { locale: lang }),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        const code = body.error ?? "";
        setErrorMsg(
          ERROR_MESSAGES[code] ?? `Generation failed (${res.status}).`,
        );
        setGen("error");
        return;
      }
      const data = (await res.json()) as {
        resume: ResumeType;
        locale: Locale;
      };
      setResult({ resume: data.resume, locale: data.locale });
      setGen("idle");
    } catch {
      setErrorMsg("Couldn’t reach the server. Try again.");
      setGen("error");
    }
  };

  // Returns to the input form. `jd` is left intact so the previous text is
  // pre-filled, per the acceptance criteria.
  const onGenerateAgain = () => {
    setResult(null);
    setGen("idle");
    setErrorMsg(null);
  };

  const onDownload = async () => {
    if (!result || downloading) return;
    setDownloading(true);
    try {
      // Single-locale PDF via the existing react-pdf pipeline. Passing the
      // generated locale makes month names format correctly.
      const blob = await pdf(
        <Resume resume={result.resume} locale={result.locale} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugifyName(result.resume.header.name)}_jd.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg("PDF export failed. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  // -- Result view (read-only preview of the generated CV) ---------------

  if (result) {
    return (
      <div style={resultViewStyle}>
        <div style={resultBarStyle}>
          <span style={resultTitleStyle}>
            <Sparkles size={16} strokeWidth={2.5} color={theme.color.primary} />
            Tailored CV
          </span>
          <span style={localeChipStyle} title="Output language of this CV">
            {LOCALE_LABELS[result.locale]}
          </span>
          <span style={{ flex: 1 }} />
          <button type="button" style={againButtonStyle} onClick={onGenerateAgain}>
            <ArrowLeft size={14} strokeWidth={2.5} />
            Generate again
          </button>
          <button
            type="button"
            style={{
              ...downloadButtonStyle,
              opacity: downloading ? 0.7 : 1,
              cursor: downloading ? "wait" : "pointer",
            }}
            onClick={() => void onDownload()}
            disabled={downloading}
            title="Download this CV as a PDF"
          >
            {downloading ? <Spinner /> : <Download size={14} strokeWidth={2.5} />}
            {downloading ? "Exporting…" : "Download PDF"}
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {/* Read-only: the override makes the existing preview tree render this
              generated resume instead of the store, with no editing controls. */}
          <PreviewSourceContext.Provider
            value={{ resume: result.resume, locale: result.locale }}
          >
            <HtmlPreview />
          </PreviewSourceContext.Provider>
        </div>
      </div>
    );
  }

  // -- Loading / unreachable / unconfigured gates ------------------------

  if (statusError) {
    return (
      <div style={viewStyle}>
        <div style={containerStyle}>
          <div style={errorRowStyle}>
            <AlertTriangle size={16} strokeWidth={2} />
            Couldn’t reach the server. Try again.
          </div>
        </div>
      </div>
    );
  }

  if (status === null) {
    return (
      <div style={viewStyle}>
        <div style={containerStyle}>
          <div style={statusRowStyle}>
            <Spinner />
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (!status.configured) {
    return (
      <div style={viewStyle}>
        <div style={containerStyle}>
          <h1 style={headingStyle}>
            <Sparkles size={22} strokeWidth={2} color={theme.color.primary} />
            Resume by JD
          </h1>
          <div style={nudgeCardStyle}>
            <strong style={{ color: theme.color.panelText, fontWeight: 700 }}>
              AI provider not configured
            </strong>
            <span>
              Add <code style={codeStyle}>AI_PROVIDER_API_KEY</code> to your{" "}
              <code style={codeStyle}>.env</code> to enable this feature, then
              restart the server.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -- Generation form ---------------------------------------------------

  const generating = gen === "generating";
  const disabled = generating || !jd.trim();

  return (
    <div style={viewStyle}>
      <div style={containerStyle}>
        <h1 style={headingStyle}>
          <Sparkles size={22} strokeWidth={2} color={theme.color.primary} />
          Resume by JD
        </h1>
        <p style={subheadingStyle}>
          Paste a job description and generate a CV tailored to it — relevant
          experience surfaced, descriptions rewritten to match the role.
        </p>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="jd-text">
            Job description
          </label>
          <textarea
            id="jd-text"
            style={textareaStyle}
            placeholder="Paste the job description here…"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            disabled={generating}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 2px ${theme.color.primary}`;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Output language</span>
          <div style={segmentGroupStyle} role="group" aria-label="Output language">
            {LANG_OPTIONS.map((opt) => {
              const active = opt.value === lang;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLang(opt.value)}
                  aria-pressed={active}
                  disabled={generating}
                  style={active ? segmentActiveStyle : segmentBaseStyle}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onGenerate()}
          disabled={disabled}
          style={{
            ...generateButtonStyle,
            opacity: disabled ? 0.6 : 1,
            cursor: generating ? "wait" : disabled ? "not-allowed" : "pointer",
          }}
        >
          {generating ? <Spinner /> : <Sparkles size={16} strokeWidth={2.5} />}
          {generating ? "Generating…" : "Generate"}
        </button>

        {generating && (
          <div style={statusRowStyle}>
            <Spinner />
            Generating your tailored CV…
          </div>
        )}

        {gen === "error" && errorMsg && (
          <div style={errorRowStyle}>
            <AlertTriangle size={16} strokeWidth={2} />
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
