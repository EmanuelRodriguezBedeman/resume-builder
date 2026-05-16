import { Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Header as HeaderType } from "../types.ts";
import { Icon } from "./icons.tsx";

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  name: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    width: "33%",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  itemText: {
    fontSize: 9,
    color: "#000",
    textDecoration: "none",
    marginLeft: 4,
  },
});

export function Header({ header }: { header: HeaderType }) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{header.name}</Text>
      <View style={styles.grid}>
        {header.items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Icon name={item.icon} size={9} />
            {item.href ? (
              <Link src={item.href} style={styles.itemText}>
                {item.text}
              </Link>
            ) : (
              <Text style={styles.itemText}>{item.text}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
