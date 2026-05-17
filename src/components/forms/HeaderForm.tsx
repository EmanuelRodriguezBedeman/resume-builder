import type { Resume } from "../../types.ts";
import { useStore } from "../../store.ts";
import { withHeaderItem } from "../../updaters.ts";
import {
  IconPicker,
  TextField,
  cardStyle,
  fieldGroupStyle,
  labelStyle,
} from "./shared.tsx";

export function HeaderForm({ resume }: { resume: Resume }) {
  const updateHeaderName = useStore((s) => s.updateHeaderName);
  const setResume = useStore((s) => s.setResume);

  return (
    <div>
      <h2 style={{ fontSize: "1rem", margin: "0 0 1rem", fontWeight: 700 }}>
        Header
      </h2>
      <TextField
        label="Name"
        value={resume.header.name}
        onChange={updateHeaderName}
      />

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Contact items</label>
        {resume.header.items.map((item) => (
          <div key={item.id} style={cardStyle}>
            <div style={{ fontSize: "0.78rem", color: "#555", marginBottom: "0.4rem" }}>
              id: <code>{item.id}</code>
            </div>
            <IconPicker
              label="Icon"
              value={item.icon}
              onChange={(icon) =>
                setResume((r) => withHeaderItem(r, item.id, { icon }))
              }
            />
            <TextField
              label="Text"
              value={item.text}
              onChange={(text) =>
                setResume((r) => withHeaderItem(r, item.id, { text }))
              }
            />
            <TextField
              label="URL (optional)"
              value={item.href ?? ""}
              placeholder="https://… or mailto:…"
              onChange={(href) =>
                setResume((r) =>
                  withHeaderItem(r, item.id, href ? { href } : { href: undefined }),
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
