import { Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import type {
  ShowcaseItem,
  ShowcaseSection as ShowcaseSectionType,
} from "../../types.ts";
import { DescriptionBlocks } from "../DescriptionBlocks.tsx";
import { SectionHeading } from "../SectionHeading.tsx";
import { Icon } from "../icons.tsx";

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
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  techStack: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 9,
    color: MUTED,
    marginLeft: 6,
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
    marginTop: 2,
  },
  linkIcon: {
    marginRight: 5,
  },
  linkLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#000",
    textDecoration: "none",
  },
});

function ProjectItem({ item }: { item: ShowcaseItem }) {
  return (
    <View style={styles.item} wrap={false}>
      <View style={styles.headRow}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.techStack}>[{item.techStack.join(", ")}]</Text>
      </View>
      <DescriptionBlocks blocks={item.description} />
      {item.links.length > 0 ? (
        <View style={styles.links}>
          {item.links.map((link) => (
            <View key={link.id} style={styles.link}>
              <View style={styles.linkIcon}>
                <Icon name={link.icon} size={10} />
              </View>
              {link.href ? (
                <Link src={link.href} style={styles.linkLabel}>
                  <Text>{link.label}</Text>
                </Link>
              ) : (
                <Text style={styles.linkLabel}>{link.label}</Text>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ShowcaseSection({
  section,
}: {
  section: ShowcaseSectionType;
}) {
  return (
    <View style={styles.section}>
      <SectionHeading title={section.title} />
      {section.items.map((item) => (
        <ProjectItem key={item.id} item={item} />
      ))}
    </View>
  );
}
