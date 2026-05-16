import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CategorizedTagsSection as CategorizedTagsSectionType } from "../../types.ts";
import { SectionHeading } from "../SectionHeading.tsx";

const styles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  category: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    marginRight: 6,
  },
  tags: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.4,
  },
});

export function CategorizedTagsSection({
  section,
}: {
  section: CategorizedTagsSectionType;
}) {
  return (
    <View style={styles.section}>
      <SectionHeading title={section.title} />
      {section.items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.category}>{item.category}:</Text>
          <Text style={styles.tags}>{item.tags.join(", ")}</Text>
        </View>
      ))}
    </View>
  );
}
