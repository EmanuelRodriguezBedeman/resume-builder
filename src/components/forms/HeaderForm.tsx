import { Plus } from "lucide-react";
import type { Resume } from "../../types.ts";
import { useStore } from "../../store.ts";
import { theme } from "../../theme.ts";
import {
  withHeaderItem,
  withHeaderItemAdded,
  withHeaderItemRemoved,
} from "../../updaters.ts";
import { InlineConfirm } from "../InlineConfirm.tsx";
import {
  IconPicker,
  TextField,
  cardStyle,
  dangerLinkStyle,
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

  return (
    <div>
      <h2 style={{ fontSize: "1.05rem", margin: "0 0 1.1rem", fontWeight: 700 }}>
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
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontSize: "0.74rem", color: theme.color.panelTextMuted }}>
                <code>{item.id}</code>
              </span>
              <InlineConfirm
                ariaLabel={`remove header item ${item.text}`}
                onConfirm={() => setResume((r) => withHeaderItemRemoved(r, item.id))}
                trigger={({ onClick }) => (
                  <button type="button" onClick={onClick} style={dangerLinkStyle}>
                    Remove
                  </button>
                )}
              />
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
          <Plus size={12} />
          Add contact item
        </button>
      </div>
    </div>
  );
}
