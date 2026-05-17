import type { Resume } from "../../types.ts";
import { useStore } from "../../store.ts";
import {
  withHeaderItem,
  withHeaderItemAdded,
  withHeaderItemRemoved,
} from "../../updaters.ts";
import {
  IconPicker,
  TextField,
  cardStyle,
  dangerButtonStyle,
  fieldGroupStyle,
  labelStyle,
  subtleButtonStyle,
} from "./shared.tsx";

export function HeaderForm({ resume }: { resume: Resume }) {
  const updateHeaderName = useStore((s) => s.updateHeaderName);
  const setResume = useStore((s) => s.setResume);

  function handleAddItem() {
    const id = `header-item-${Date.now()}`;
    setResume((r) =>
      withHeaderItemAdded(r, { id, icon: "link", text: "", href: "" }),
    );
  }

  function handleRemoveItem(itemId: string, text: string) {
    const confirmed = window.confirm(
      `Remove header item "${text || itemId}"?`,
    );
    if (!confirmed) return;
    setResume((r) => withHeaderItemRemoved(r, itemId));
  }

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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.4rem",
              }}
            >
              <span style={{ fontSize: "0.78rem", color: "#555" }}>
                id: <code>{item.id}</code>
              </span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id, item.text)}
                style={dangerButtonStyle}
              >
                Remove
              </button>
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
                  withHeaderItem(
                    r,
                    item.id,
                    href ? { href } : { href: undefined },
                  ),
                )
              }
            />
          </div>
        ))}
        <button type="button" onClick={handleAddItem} style={subtleButtonStyle}>
          + Add contact item
        </button>
      </div>
    </div>
  );
}
