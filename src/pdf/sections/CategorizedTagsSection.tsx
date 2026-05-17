import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CategorizedTagsSection as CategorizedTagsSectionType } from "../../types.ts";
import { SectionHeading } from "../SectionHeading.tsx";

const BODY_COLOR = "#333";

const styles = StyleSheet.create({
  section: {
    marginBottom: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },
  categoryCol: {
    width: 90,
  },
  category: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
  },
  tagsCol: {
    flex: 1,
  },
  tags: {
    fontSize: 9.5,
    lineHeight: 1.4,
    color: BODY_COLOR,
  },
});

export function CategorizedTagsSection({
  section,
}: {
  section: CategorizedTagsSectionType;
}) {
  return (
    <View style={styles.section} wrap={false}>
      <SectionHeading title={section.title} />
      {section.items.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.categoryCol}>
            <Text style={styles.category}>{item.category}:</Text>
          </View>
          <View style={styles.tagsCol}>
            <Text style={styles.tags}>{item.tags.join(", ")}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
