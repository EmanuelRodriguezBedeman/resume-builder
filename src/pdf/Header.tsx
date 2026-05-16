import { Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Header as HeaderType, HeaderItem } from "../types.ts";
import { Icon } from "./icons.tsx";

const ICON_SIZE = 13;
const FONT_SIZE = 9;
const ITEMS_PER_ROW = 3;

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  name: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemIcon: {
    marginRight: 6,
  },
  itemText: {
    fontSize: FONT_SIZE,
    color: "#000",
    textDecoration: "none",
  },
});

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function HeaderItemView({ item }: { item: HeaderItem }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemIcon}>
        <Icon name={item.icon} size={ICON_SIZE} />
      </View>
      {item.href ? (
        <Link src={item.href} style={styles.itemText}>
          <Text wrap={false}>{item.text}</Text>
        </Link>
      ) : (
        <Text wrap={false} style={styles.itemText}>
          {item.text}
        </Text>
      )}
    </View>
  );
}

export function Header({ header }: { header: HeaderType }) {
  const rows = chunk(header.items, ITEMS_PER_ROW);
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{header.name}</Text>
      {rows.map((row, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <View key={idx} style={styles.row}>
          {row.map((item) => (
            <HeaderItemView key={item.id} item={item} />
          ))}
        </View>
      ))}
    </View>
  );
}
