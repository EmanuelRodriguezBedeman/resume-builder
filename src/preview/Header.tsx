import type { CSSProperties } from "react";
import type { Header as HeaderType, HeaderItem } from "../types.ts";
import { Icon } from "./icons.tsx";

const ICON_SIZE = 13;
const FONT_SIZE_PT = 9;
const ITEMS_PER_ROW = 3;

const containerStyle: CSSProperties = {
  marginBottom: "24pt",
};

const nameStyle: CSSProperties = {
  fontSize: "32pt",
  fontFamily: "Helvetica-Bold, Helvetica, Arial, sans-serif",
  fontWeight: 700,
  textAlign: "center",
  marginBottom: "18pt",
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "9pt",
};

const itemStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
};

const itemIconStyle: CSSProperties = {
  marginRight: "6pt",
  display: "inline-flex",
  alignItems: "center",
};

const itemTextStyle: CSSProperties = {
  fontSize: `${FONT_SIZE_PT}pt`,
  color: "#000",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function HeaderItemView({ item }: { item: HeaderItem }) {
  return (
    <div style={itemStyle}>
      <span style={itemIconStyle}>
        <Icon name={item.icon} size={ICON_SIZE} />
      </span>
      {item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          style={itemTextStyle}
        >
          {item.text}
        </a>
      ) : (
        <span style={itemTextStyle}>{item.text}</span>
      )}
    </div>
  );
}

export function Header({ header }: { header: HeaderType }) {
  const rows = chunk(header.items, ITEMS_PER_ROW);
  return (
    <div style={containerStyle}>
      <div style={nameStyle}>{header.name}</div>
      {rows.map((row, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={idx} style={rowStyle}>
          {row.map((item) => (
            <HeaderItemView key={item.id} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}
