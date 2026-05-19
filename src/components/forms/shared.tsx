import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import type {
  DateRange,
  DescriptionBlock,
  FlexibleDate,
  IconName,
  ShowcaseLink,
} from "../../types.ts";
import { theme } from "../../theme.ts";
import { useStore } from "../../store.ts";
import {
  commitTranslation,
  isFieldStale,
  type TranslationPath,
} from "../../locale/translation.ts";
import { InlineConfirm } from "../InlineConfirm.tsx";

// -- Shared styles ------------------------------------------------------

export const fieldGroupStyle: CSSProperties = {
  marginBottom: "1.1rem",
};

export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  color: theme.color.panelTextMuted,
  marginBottom: "0.35rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontFamily: theme.font.family,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  fontSize: "0.9rem",
  border: `1px solid ${theme.color.panelInputBorder}`,
  background: theme.color.panelInputBg,
  borderRadius: theme.radius.input,
  boxSizing: "border-box",
  fontFamily: theme.font.family,
  color: theme.color.panelText,
  outline: "none",
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "none",
  overflow: "hidden",
  lineHeight: 1.4,
};

export const subtleButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  fontSize: "0.78rem",
  padding: "0.4rem 0.7rem",
  background: theme.color.panelInputBg,
  border: `1px solid ${theme.color.panelCardBorder}`,
  borderRadius: theme.radius.sm,
  cursor: "pointer",
  color: theme.color.panelText,
  fontFamily: theme.font.family,
};

export const dangerLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  fontSize: "0.78rem",
  padding: "0.3rem 0.6rem",
  background: "transparent",
  border: "none",
  borderRadius: theme.radius.sm,
  cursor: "pointer",
  color: theme.color.danger,
  fontFamily: theme.font.family,
};

export const cardStyle: CSSProperties = {
  border: `1px solid ${theme.color.panelCardBorder}`,
  borderRadius: theme.radius.card,
  padding: "0.85rem 1rem",
  marginBottom: "0.65rem",
  background: theme.color.panelCardBg,
  color: theme.color.panelText,
  boxShadow: theme.shadow.card,
};

// -- Translation props + stale marker ----------------------------------

// Passed to TextField / TextAreaField for Translatable fields. The
// field-level on-blur handler invokes `commitTranslation` with these,
// which calls the backend's /translate endpoint and writes the result
// into the peer locale via `applyTranslation`.
export type TranslationProps = {
  path: TranslationPath;
  /** Current peer-locale value at the same path. Used as the baseline-pin
   *  hash on translation failure (see translation.ts). */
  peerValue: string;
  /** Writes the translated string into the peer locale. Caller composes
   *  this from `setResumeForLocale(peerLocale, …)` plus the appropriate
   *  field updater. */
  applyTranslation: (translated: string) => void;
};

const labelRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.4rem",
  marginBottom: "0.35rem",
};

const labelTextStyle: CSSProperties = {
  fontSize: "0.72rem",
  color: theme.color.panelTextMuted,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontFamily: theme.font.family,
};

// Soft danger-color treatment per design-system §4: small icon, rose-500
// (not alarm-red), no background fill. Acts as a button so the click
// reaches `onRetry` — but visually it reads as a status indicator that
// happens to be clickable, not a primary action.
const staleMarkerStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  background: "transparent",
  border: "none",
  padding: "2px 4px",
  borderRadius: theme.radius.sm,
  color: theme.color.danger,
  cursor: "pointer",
  fontFamily: theme.font.family,
  fontSize: "0.66rem",
  fontWeight: 600,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  lineHeight: 1,
};

function StaleMarker({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      title="Translation out of sync — click to retry"
      aria-label="Retry translation"
      style={staleMarkerStyle}
    >
      <AlertTriangle size={12} strokeWidth={2.25} />
      <span>Stale</span>
    </button>
  );
}

// React hook bundling the per-field translation wiring. Reads activeValue
// (the current displayed value, i.e. the source for peer's translation)
// so it can derive whether the peer is stale, and exposes `runCommit`
// for the on-blur / retry handlers.
function useTranslationField(
  translation: TranslationProps | undefined,
  activeValue: string,
) {
  const activeLocale = useStore((s) => s.activeLocale);
  const hashes = useStore((s) =>
    translation ? s.translationHashes[translation.path] : undefined,
  );

  if (!translation) {
    return {
      peerIsStale: false,
      runCommit: (_v: string) => {},
    };
  }

  // Peer is stale when hashes[peerLocale] (= hash of active value at last
  // sync) no longer matches the current active value.
  const peerLocale = activeLocale === "en" ? "es" : "en";
  const peerIsStale = isFieldStale(hashes, peerLocale, activeValue);

  const runCommit = (newActiveValue: string) =>
    void commitTranslation({
      path: translation.path,
      newActiveValue,
      peerValueAtAttempt: translation.peerValue,
      applyTranslation: translation.applyTranslation,
    });
  return { peerIsStale, runCommit };
}

// -- Text input ---------------------------------------------------------

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  translation,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  translation?: TranslationProps;
}) {
  const focusValueRef = useRef<string | null>(null);
  const { peerIsStale, runCommit } = useTranslationField(translation, value);
  return (
    <div style={fieldGroupStyle}>
      <div style={labelRowStyle}>
        <span style={labelTextStyle}>{label}</span>
        {peerIsStale ? <StaleMarker onRetry={() => runCommit(value)} /> : null}
      </div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          focusValueRef.current = value;
          e.target.style.boxShadow = `0 0 0 2px ${theme.color.primary}`;
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = "none";
          if (
            translation &&
            focusValueRef.current !== null &&
            focusValueRef.current !== value
          ) {
            runCommit(value);
          }
          focusValueRef.current = null;
        }}
        style={inputStyle}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  translation,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  translation?: TranslationProps;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const focusValueRef = useRef<string | null>(null);
  const { peerIsStale, runCommit } = useTranslationField(translation, value);
  // Auto-grow to fit content. Runs before paint to avoid flash.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <div style={fieldGroupStyle}>
      <div style={labelRowStyle}>
        <span style={labelTextStyle}>{label}</span>
        {peerIsStale ? <StaleMarker onRetry={() => runCommit(value)} /> : null}
      </div>
      <textarea
        ref={ref}
        value={value}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          focusValueRef.current = value;
          e.target.style.boxShadow = `0 0 0 2px ${theme.color.primary}`;
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = "none";
          if (
            translation &&
            focusValueRef.current !== null &&
            focusValueRef.current !== value
          ) {
            runCommit(value);
          }
          focusValueRef.current = null;
        }}
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

// -- Date editors -------------------------------------------------------

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
        <span style={{ color: theme.color.panelTextMuted, fontSize: "0.8rem" }}>
          →
        </span>
        <input
          type="text"
          value={value.end ?? ""}
          placeholder="YYYY-MM"
          disabled={isPresent}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          style={{
            ...inputStyle,
            flex: 1,
            opacity: isPresent ? 0.55 : 1,
          }}
        />
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          marginTop: "0.45rem",
          fontSize: "0.82rem",
          color: theme.color.panelTextMuted,
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
          style={{ accentColor: theme.color.primary }}
        />
        Present
      </label>
    </div>
  );
}

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
        <span style={{ color: theme.color.panelTextMuted, fontSize: "0.8rem" }}>
          →
        </span>
        <input
          type="text"
          value={end}
          placeholder="(optional)"
          onChange={(e) => {
            const newEnd = e.target.value;
            if (start === "" && newEnd === "") onChange(undefined);
            else onChange({ start, ...(newEnd ? { end: newEnd } : {}) });
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
    </div>
  );
}

// -- Tag list editor ----------------------------------------------------

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
          gap: "0.35rem",
          marginBottom: "0.5rem",
        }}
      >
        {tags.map((tag, idx) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.2rem 0.55rem",
              background: theme.color.panelInputBg,
              border: `1px solid ${theme.color.panelCardBorder}`,
              borderRadius: theme.radius.pill,
              fontSize: "0.8rem",
              fontFamily: theme.font.family,
              color: theme.color.panelText,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "none",
                background: "transparent",
                color: theme.color.panelTextMuted,
                cursor: "pointer",
                padding: 0,
              }}
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
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
        style={inputStyle}
      />
    </div>
  );
}

// -- Link list editor ---------------------------------------------------

export function LinkListEditor({
  links,
  onUpdate,
  onAdd,
  onRemove,
  labelTranslationFor,
}: {
  links: ShowcaseLink[];
  onUpdate: (linkId: string, patch: Partial<Omit<ShowcaseLink, "id">>) => void;
  onAdd: () => void;
  onRemove: (linkId: string) => void;
  /** Caller-supplied builder for the Translatable `label` field per link. */
  labelTranslationFor?: (linkId: string) => TranslationProps | undefined;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>Links</label>
      {links.length === 0 ? (
        <p
          style={{
            color: theme.color.panelTextMuted,
            fontSize: "0.82rem",
            margin: "0 0 0.5rem",
          }}
        >
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
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{ fontSize: "0.74rem", color: theme.color.panelTextMuted }}
            >
              <code>{link.id}</code>
            </span>
            <InlineConfirm
              ariaLabel={`remove link ${link.label}`}
              onConfirm={() => onRemove(link.id)}
              trigger={({ onClick }) => (
                <button type="button" onClick={onClick} style={dangerLinkStyle}>
                  Remove
                </button>
              )}
            />
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
            translation={labelTranslationFor?.(link.id)}
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
        <Plus size={12} />
        Add link
      </button>
    </div>
  );
}

// -- Description block editor ------------------------------------------

export function DescriptionBlockEditor({
  blocks,
  onChange,
  onAdd,
  onRemove,
  blockTranslationFor,
}: {
  blocks: DescriptionBlock[];
  onChange: (idx: number, patch: Partial<DescriptionBlock>) => void;
  onAdd: (type: DescriptionBlock["type"]) => void;
  onRemove: (idx: number) => void;
  /** Caller-supplied builder for Translatable block fields (text + leadIn). */
  blockTranslationFor?: (
    idx: number,
    field: "text" | "leadIn",
  ) => TranslationProps | undefined;
}) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>Description</label>
      {blocks.length === 0 ? (
        <p style={{ color: theme.color.panelTextMuted, fontSize: "0.82rem" }}>
          No blocks.
        </p>
      ) : null}
      {blocks.map((block, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={idx} style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.45rem",
            }}
          >
            <span
              style={{ fontSize: "0.74rem", color: theme.color.panelTextMuted }}
            >
              Block {idx + 1} · {block.type}
            </span>
            <InlineConfirm
              ariaLabel={`remove block ${idx + 1}`}
              onConfirm={() => onRemove(idx)}
              trigger={({ onClick }) => (
                <button type="button" onClick={onClick} style={dangerLinkStyle}>
                  Remove
                </button>
              )}
            />
          </div>
          {block.type === "bullet" ? (
            <TextField
              label="Lead-in (optional, bold prefix)"
              value={block.leadIn ?? ""}
              onChange={(leadIn) =>
                onChange(idx, leadIn ? { leadIn } : { leadIn: undefined })
              }
              translation={blockTranslationFor?.(idx, "leadIn")}
            />
          ) : null}
          <TextAreaField
            label="Text"
            value={block.text}
            onChange={(text) => onChange(idx, { text })}
            translation={blockTranslationFor?.(idx, "text")}
          />
        </div>
      ))}
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <button
          type="button"
          onClick={() => onAdd("paragraph")}
          style={subtleButtonStyle}
        >
          <Plus size={12} />
          Add paragraph
        </button>
        <button
          type="button"
          onClick={() => onAdd("bullet")}
          style={subtleButtonStyle}
        >
          <Plus size={12} />
          Add bullet
        </button>
      </div>
    </div>
  );
}
