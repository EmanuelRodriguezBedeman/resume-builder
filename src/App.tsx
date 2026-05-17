import { useEffect, useMemo, type CSSProperties } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Resume } from "./pdf/Resume.tsx";
import { HtmlPreview } from "./preview/HtmlPreview.tsx";
import { FormPanel } from "./components/FormPanel.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { useStore } from "./store.ts";
import type { Resume as ResumeType } from "./types.ts";

function slugifyName(name: string): string {
  return name.trim().replace(/\s+/g, "_") || "resume";
}

const toolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.5rem 1rem",
  borderBottom: "1px solid #d0d0d0",
  background: "#fafafa",
  fontFamily: "system-ui, sans-serif",
  fontSize: "0.875rem",
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4em",
  padding: "0.4em 0.9em",
  borderRadius: "6px",
  border: "1px solid #1f6feb",
  background: "#1f6feb",
  color: "#fff",
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#8aa9d9",
  borderColor: "#8aa9d9",
  cursor: "default",
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
      <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>Error loading resume</h1>
        <pre>{state.error}</pre>
      </main>
    );
  }

  if (state.status === "loading") {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        Loading…
      </main>
    );
  }

  return <LoadedApp resume={state.resume} />;
}

function LoadedApp({ resume }: { resume: ResumeType }) {
  const fileName = `${slugifyName(resume.header.name)}.pdf`;

  // Memoize the React-PDF Resume element so the download link only
  // regenerates its blob when the underlying resume changes.
  const exportDocument = useMemo(
    () => <Resume resume={resume} />,
    [resume],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={toolbarStyle}>
        <span style={{ color: "#555" }}>Resume Builder</span>
        <PDFDownloadLink
          document={exportDocument}
          fileName={fileName}
          style={buttonStyle}
        >
          {({ loading, error: dlError }) => {
            if (dlError) return "Export failed";
            return (
              <span style={loading ? disabledButtonStyle : undefined}>
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
