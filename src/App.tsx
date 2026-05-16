import { useEffect, useState } from "react";

export function App() {
  const [backendStatus, setBackendStatus] = useState<string>("checking…");

  useEffect(() => {
    fetch("/health")
      .then((r) => r.json())
      .then((data: { ok: boolean }) => {
        setBackendStatus(data.ok ? "ok" : "unexpected response");
      })
      .catch((err: unknown) => {
        setBackendStatus(`unreachable (${String(err)})`);
      });
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Resume Builder</h1>
      <p>Slice 1 — scaffold placeholder.</p>
      <p>
        Backend: <strong>{backendStatus}</strong>
      </p>
    </main>
  );
}
