import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { TimelineSection as TimelineSectionType } from "../../types.ts";
import { DescriptionBlocks } from "../DescriptionBlocks.tsx";
import { SectionHeading } from "../SectionHeading.tsx";
import { formatDateRange } from "../format.ts";

const MUTED = "#555";

const styles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  item: {
    marginBottom: 14,
  },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  date: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 9,
    color: MUTED,
  },
  subtitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 0.5,
    color: MUTED,
    marginTop: 2,
  },
});

export function TimelineSection({
  section,
}: {
  section: TimelineSectionType;
}) {
  return (
    <View style={styles.section}>
      <SectionHeading title={section.title} />
      {section.items.map((item) => (
        <View key={item.id} style={styles.item} wrap={false}>
          <View style={styles.headRow}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.date}>{formatDateRange(item.dateRange)}</Text>
          </View>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <DescriptionBlocks blocks={item.description} />
        </View>
      ))}
    </View>
  );
}
