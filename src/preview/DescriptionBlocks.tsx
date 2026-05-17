import type { CSSProperties } from "react";
import type { DescriptionBlock } from "../types.ts";

const BODY_COLOR = "#333";
const TEXT_INDENT_PT = 22;
const BULLET_GUTTER_PT = 12;

const containerStyle: CSSProperties = {
  marginTop: "4pt",
};

const paragraphStyle: CSSProperties = {
  paddingLeft: `${TEXT_INDENT_PT}pt`,
  fontSize: "9.5pt",
  lineHeight: 1.4,
  color: BODY_COLOR,
  marginTop: "5pt",
};

const bulletRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  paddingLeft: `${BULLET_GUTTER_PT}pt`,
  marginTop: "4pt",
};

const bulletDotStyle: CSSProperties = {
  width: `${TEXT_INDENT_PT - BULLET_GUTTER_PT}pt`,
  fontSize: "9.5pt",
  lineHeight: 1.4,
  color: BODY_COLOR,
  flexShrink: 0,
};

const bulletTextStyle: CSSProperties = {
  flex: 1,
  fontSize: "9.5pt",
  lineHeight: 1.4,
  color: BODY_COLOR,
};

const leadInStyle: CSSProperties = {
  fontFamily: "Helvetica-Bold, Helvetica, Arial, sans-serif",
  fontWeight: 700,
};

export function DescriptionBlocks({ blocks }: { blocks: DescriptionBlock[] }) {
  return (
    <div style={containerStyle}>
      {blocks.map((block, idx) => {
        if (block.type === "paragraph") {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={idx} style={paragraphStyle}>
              {block.text}
            </div>
          );
        }
        return (
          // eslint-disable-next-line react/no-array-index-key
          <div key={idx} style={bulletRowStyle}>
            <span style={bulletDotStyle}>•</span>
            <span style={bulletTextStyle}>
              {block.leadIn ? (
                <span style={leadInStyle}>{block.leadIn}: </span>
              ) : null}
              {block.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
