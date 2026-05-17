import { useEffect, useState } from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Resume } from "./pdf/Resume.tsx";
import type { Resume as ResumeType } from "./types.ts";

function slugifyName(name: string): string {
  return name.trim().replace(/\s+/g, "_") || "resume";
}

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.5rem 1rem",
  borderBottom: "1px solid #d0d0d0",
  background: "#fafafa",
  fontFamily: "system-ui, sans-serif",
  fontSize: "0.875rem",
};

const buttonStyle: React.CSSProperties = {
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

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#8aa9d9",
  borderColor: "#8aa9d9",
  cursor: "default",
};

export function App() {
  const [resume, setResume] = useState<ResumeType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/resume")
      .then((r) => r.json() as Promise<{ resume: ResumeType }>)
      .then((data) => setResume(data.resume))
      .catch((err: unknown) => setError(String(err)));
  }, []);

  if (error) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>Error loading resume</h1>
        <pre>{error}</pre>
      </main>
    );
  }

  if (!resume) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        Loading…
      </main>
    );
  }

  const fileName = `${slugifyName(resume.header.name)}.pdf`;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <div style={toolbarStyle}>
        <span style={{ color: "#555" }}>Resume Builder</span>
        <PDFDownloadLink
          document={<Resume resume={resume} />}
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
      <div style={{ flex: 1, minHeight: 0 }}>
        <PDFViewer width="100%" height="100%">
          <Resume resume={resume} />
        </PDFViewer>
      </div>
    </div>
  );
}
