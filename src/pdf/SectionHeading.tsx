import { StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 12,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: "#000",
    marginLeft: 6,
    marginBottom: 3,
  },
});

export function SectionHeading({ title }: { title: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rule} />
    </View>
  );
}
