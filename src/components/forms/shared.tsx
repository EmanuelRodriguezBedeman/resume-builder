import { useState, type CSSProperties } from "react";
import type {
  DateRange,
  DescriptionBlock,
  FlexibleDate,
  IconName,
  ShowcaseLink,
} from "../../types.ts";

// -- Shared styles ------------------------------------------------------

export const fieldGroupStyle: CSSProperties = {
  marginBottom: "1rem",
};

export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  color: "#555",
  marginBottom: "0.3rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.4rem 0.55rem",
  fontSize: "0.9rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif",
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "4rem",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.4,
};

export const subtleButtonStyle: CSSProperties = {
  fontSize: "0.78rem",
  padding: "0.25rem 0.55rem",
  background: "#f0f1f3",
  border: "1px solid #ccc",
  borderRadius: "3px",
  cursor: "pointer",
  color: "#333",
};

export const dangerButtonStyle: CSSProperties = {
  ...subtleButtonStyle,
  color: "#a52a2a",
  borderColor: "#d9b0b0",
};

export const cardStyle: CSSProperties = {
  border: "1px solid #e0e0e0",
  borderRadius: "6px",
  padding: "0.6rem 0.7rem",
  marginBottom: "0.5rem",
  background: "#fafbfc",
};

// -- Text input ---------------------------------------------------------

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        rows={rows ?? 3}
        onChange={(e) => onChange(e.target.value)}
        style={textareaStyle}
      />
    </div>
  );
}

// -- Icon picker --------------------------------------------------------

const ALL_ICONS: IconName[] = [
  "mail",
  "phone",
  "map-pin",
  "link",
  "github",
  "linkedin",
  "bar-chart-3",
];

export function IconPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: IconName;
  onChange: (next: IconName) => void;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as IconName)}
        style={inputStyle}
      >
        {ALL_ICONS.map((icon) => (
          <option key={icon} value={icon}>
            {icon}
          </option>
        ))}
      </select>
    </div>
  );
}

// -- Date range editor (Timeline: start + end or "Present") -----------

export function DateRangeEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DateRange;
  onChange: (next: DateRange) => void;
}) {
  const isPresent = value.end === null;
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <input
          type="text"
          value={value.start}
          placeholder="YYYY-MM"
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          style={{ ...inputStyle, flex: 1 }}
        />
        <span style={{ color: "#888", fontSize: "0.8rem" }}>→</span>
        <input
          type="text"
          value={value.end ?? ""}
          placeholder="YYYY-MM"
          disabled={isPresent}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          style={{
            ...inputStyle,
            flex: 1,
            background: isPresent ? "#f0f0f0" : undefined,
          }}
        />
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          marginTop: "0.4rem",
          fontSize: "0.82rem",
          color: "#444",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={isPresent}
          onChange={(e) =>
            onChange({
              ...value,
              end: e.target.checked ? null : "",
            })
          }
        />
        Present
      </label>
    </div>
  );
}

// -- Flexible date editor (CompactGrid: optional start + optional end) -

export function FlexibleDateEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FlexibleDate | undefined;
  onChange: (next: FlexibleDate | undefined) => void;
}) {
  const start = value?.start ?? "";
  const end = value?.end ?? "";
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <input
          type="text"
          value={start}
          placeholder="YYYY or YYYY-MM"
          onChange={(e) => {
            const newStart = e.target.value;
            if (newStart === "" && end === "") onChange(undefined);
            else onChange({ start: newStart, ...(end ? { end } : {}) });
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
        <span style={{ color: "#888", fontSize: "0.8rem" }}>→</span>
        <input
          type="text"
          value={end}
          placeholder="(optional)"
          onChange={(e) => {
            const newEnd = e.target.value;
            if (start === "" && newEnd === "") onChange(undefined);
            else
              onChange({
                start: start,
                ...(newEnd ? { end: newEnd } : {}),
              });
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
    </div>
  );
}

// -- Tag list editor (chip-style with add + remove) -------------------

export function TagListEditor({
  label,
  tags,
  onAdd,
  onRemove,
}: {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (idx: number) => void;
}) {
  const [pending, setPending] = useState("");
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.3rem",
          marginBottom: "0.4rem",
        }}
      >
        {tags.map((tag, idx) => (
          // eslint-disable-next-line react/no-array-index-key
          <span
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.18rem 0.45rem",
              background: "#eef2f6",
              border: "1px solid #d0d7df",
              borderRadius: "12px",
              fontSize: "0.8rem",
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              style={{
                border: "none",
                background: "transparent",
                color: "#a52a2a",
                cursor: "pointer",
                fontSize: "0.9rem",
                padding: 0,
                lineHeight: 1,
              }}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <input
          type="text"
          placeholder="Add tag (press Enter)"
          value={pending}
          onChange={(e) => setPending(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && pending.trim()) {
              e.preventDefault();
              onAdd(pending.trim());
              setPending("");
            }
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
    </div>
  );
}

// -- Link list editor (Showcase items) --------------------------------

export function LinkListEditor({
  links,
  onUpdate,
  onAdd,
  onRemove,
}: {
  links: ShowcaseLink[];
  onUpdate: (linkId: string, patch: Partial<Omit<ShowcaseLink, "id">>) => void;
  onAdd: () => void;
  onRemove: (linkId: string) => void;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>Links</label>
      {links.length === 0 ? (
        <p style={{ color: "#888", fontSize: "0.82rem", margin: "0 0 0.5rem" }}>
          No links yet.
        </p>
      ) : null}
      {links.map((link) => (
        <div key={link.id} style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.4rem",
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#555" }}>
              id: <code>{link.id}</code>
            </span>
            <button
              type="button"
              onClick={() => onRemove(link.id)}
              style={dangerButtonStyle}
            >
              Remove
            </button>
          </div>
          <IconPicker
            label="Icon"
            value={link.icon}
            onChange={(icon) => onUpdate(link.id, { icon })}
          />
          <TextField
            label="Label"
            value={link.label}
            onChange={(label) => onUpdate(link.id, { label })}
          />
          <TextField
            label="URL"
            value={link.href ?? ""}
            placeholder="https://…"
            onChange={(href) => onUpdate(link.id, { href })}
          />
        </div>
      ))}
      <button type="button" onClick={onAdd} style={subtleButtonStyle}>
        + Add link
      </button>
    </div>
  );
}

// -- Description block editor (Timeline + Showcase) -------------------
// MVP scope: edit each existing block's text and (for bullets) leadIn.
// Add/remove of blocks deferred to a follow-up if needed.

export function DescriptionBlockEditor({
  blocks,
  onChange,
}: {
  blocks: DescriptionBlock[];
  onChange: (idx: number, patch: Partial<DescriptionBlock>) => void;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>Description</label>
      {blocks.length === 0 ? (
        <p style={{ color: "#888", fontSize: "0.82rem" }}>No blocks.</p>
      ) : null}
      {blocks.map((block, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={idx} style={cardStyle}>
          <div style={{ marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.78rem", color: "#555" }}>
              Block {idx + 1} · {block.type}
            </span>
          </div>
          {block.type === "bullet" ? (
            <TextField
              label="Lead-in (optional, bold prefix)"
              value={block.leadIn ?? ""}
              onChange={(leadIn) =>
                onChange(idx, leadIn ? { leadIn } : { leadIn: undefined })
              }
            />
          ) : null}
          <TextAreaField
            label="Text"
            value={block.text}
            rows={3}
            onChange={(text) => onChange(idx, { text })}
          />
        </div>
      ))}
    </div>
  );
}
