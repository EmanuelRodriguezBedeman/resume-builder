import { useEffect, useMemo, type CSSProperties } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText } from "lucide-react";
import { Resume } from "./pdf/Resume.tsx";
import { HtmlPreview } from "./preview/HtmlPreview.tsx";
import { FormPanel } from "./components/FormPanel.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { useStore } from "./store.ts";
import { theme } from "./theme.ts";
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
  gap: "0.5rem",
  fontWeight: 700,
  fontSize: "0.95rem",
  color: theme.color.toolbarText,
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

export function App() {
  const state = useStore((s) => s.state);
  const setLoaded = useStore((s) => s.setLoaded);
  const setError = useStore((s) => s.setError);

  useEffect(() => {
    fetch("/resume")
      .then((r) => r.json() as Promise<{ resume: ResumeType }>)
      .then((data) => setLoaded(data.resume))
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

  return <LoadedApp resume={state.resume} />;
}

function LoadedApp({ resume }: { resume: ResumeType }) {
  const fileName = `${slugifyName(resume.header.name)}.pdf`;

  const exportDocument = useMemo(
    () => <Resume resume={resume} />,
    [resume],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={toolbarStyle}>
        <span style={brandStyle}>
          <span style={brandIconStyle}>
            <FileText size={16} strokeWidth={2.5} />
          </span>
          Resume Builder
        </span>
        <PDFDownloadLink
          document={exportDocument}
          fileName={fileName}
          style={gradientButtonStyle}
        >
          {({ loading, error: dlError }) => {
            if (dlError) return "Export failed";
            return (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Download size={14} strokeWidth={2.5} />
                {loading ? "Generating…" : "Export PDF"}
              </span>
            );
          }}
        </PDFDownloadLink>
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
          <HtmlPreview resume={resume} />
        </div>
      </div>
    </div>
  );
}
