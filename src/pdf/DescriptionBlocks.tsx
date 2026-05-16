import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { DescriptionBlock } from "../types.ts";

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 9.5,
    lineHeight: 1.4,
    marginTop: 5,
  },
  bulletRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  bulletDot: {
    width: 10,
    fontSize: 9.5,
    lineHeight: 1.4,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.4,
  },
  leadIn: {
    fontFamily: "Helvetica-Bold",
  },
});

export function DescriptionBlocks({ blocks }: { blocks: DescriptionBlock[] }) {
  return (
    <View>
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
