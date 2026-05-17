import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CompactGridSection as CompactGridSectionType } from "../../types.ts";
import { SectionHeading } from "../SectionHeading.tsx";
import { formatFlexibleDate } from "../format.ts";

const DATE_COLOR = "#555";
const SUBTITLE_COLOR = "#333";

const styles = StyleSheet.create({
  section: {
    marginBottom: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "50%",
    paddingRight: 10,
    marginBottom: 14,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  date: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 8.5,
    color: DATE_COLOR,
    marginLeft: 4,
  },
  subtitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 0.5,
    color: SUBTITLE_COLOR,
    marginTop: 2,
  },
});

export function CompactGridSection({
  section,
}: {
  section: CompactGridSectionType;
}) {
  return (
    <View style={styles.section} wrap={false}>
      <SectionHeading title={section.title} />
      <View style={styles.grid}>
        {section.items.map((item) => (
          <View key={item.id} style={styles.cell}>
            <View style={styles.headRow}>
              <Text style={styles.title}>{item.title}</Text>
              {item.date ? (
                <Text style={styles.date}>
                  [{formatFlexibleDate(item.date)}]
                </Text>
              ) : null}
            </View>
            {item.subtitle ? (
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
