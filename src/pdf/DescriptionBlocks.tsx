import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { DescriptionBlock } from "../types.ts";

const BODY_COLOR = "#333";

// Layout convention: description text always starts at x=22 from the item's
// left edge. Bullet dots sit in the 12–22pt gutter so paragraph and bullet
// content lines up vertically regardless of which variant the block is.
const TEXT_INDENT = 22;
const BULLET_GUTTER = 12;
const BULLET_DOT_WIDTH = TEXT_INDENT - BULLET_GUTTER;

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  paragraph: {
    paddingLeft: TEXT_INDENT,
    fontSize: 9.5,
    lineHeight: 1.4,
    color: BODY_COLOR,
    marginTop: 5,
  },
  bulletRow: {
    flexDirection: "row",
    paddingLeft: BULLET_GUTTER,
    marginTop: 4,
  },
  bulletDot: {
    width: BULLET_DOT_WIDTH,
    fontSize: 9.5,
    lineHeight: 1.4,
    color: BODY_COLOR,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.4,
    color: BODY_COLOR,
  },
  leadIn: {
    fontFamily: "Helvetica-Bold",
  },
});

export function DescriptionBlocks({ blocks }: { blocks: DescriptionBlock[] }) {
  return (
    <View style={styles.container}>
      {blocks.map((block, idx) => {
        if (block.type === "paragraph") {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <Text key={idx} style={styles.paragraph}>
              {block.text}
            </Text>
          );
        }
        return (
          // eslint-disable-next-line react/no-array-index-key
          <View key={idx} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              {block.leadIn ? (
                <Text style={styles.leadIn}>{block.leadIn}: </Text>
              ) : null}
              {block.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
