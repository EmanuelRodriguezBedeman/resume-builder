import { useEffect, useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import { Resume } from "./pdf/Resume.tsx";
import type { Resume as ResumeType } from "./types.ts";

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

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <PDFViewer width="100%" height="100%" showToolbar>
        <Resume resume={resume} />
      </PDFViewer>
    </div>
  );
}
