import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, X } from "lucide-react";
import { theme } from "../theme.ts";

// A delete button that morphs into a [Confirm] [Cancel] pair when clicked,
// avoiding the native window.confirm() modal. Cancel-on-outside-click too.

type Props = {
  onConfirm: () => void;
  title?: string;
  ariaLabel?: string;
  trigger: (props: {
    onClick: (e: React.MouseEvent) => void;
  }) => React.ReactElement;
};

const confirmRowStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

const iconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "26px",
  height: "26px",
  border: "none",
  borderRadius: theme.radius.sm,
  cursor: "pointer",
};

const confirmBtnStyle: CSSProperties = {
  ...iconButtonStyle,
  background: theme.color.danger,
  color: "#fff",
};

const cancelBtnStyle: CSSProperties = {
  ...iconButtonStyle,
  background: "rgba(255, 255, 255, 0.1)",
  color: "rgba(255, 255, 255, 0.85)",
};

export function InlineConfirm({ onConfirm, ariaLabel, trigger }: Props) {
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!confirming) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setConfirming(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirming(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [confirming]);

  if (confirming) {
    return (
      <span ref={ref} style={confirmRowStyle}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
            setConfirming(false);
          }}
          style={confirmBtnStyle}
          title="Confirm"
          aria-label={ariaLabel ? `Confirm ${ariaLabel}` : "Confirm"}
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }}
          style={cancelBtnStyle}
          title="Cancel"
          aria-label="Cancel"
        >
          <X size={14} />
        </button>
      </span>
    );
  }

  return (
    <span ref={ref}>
      {trigger({
        onClick: (e) => {
          e.stopPropagation();
          setConfirming(true);
        },
      })}
    </span>
  );
}
