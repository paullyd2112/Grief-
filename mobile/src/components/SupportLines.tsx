import { Linking, StyleSheet, View } from "react-native";
import { radius, space, useTheme } from "../theme";
import { ListRow, Text } from "./ui";

export interface SupportLine {
  title: string;
  detail: string;
  url: string;
}

// A short list of places to turn, for the screens where Ndo itself can't
// help (suspended, underage). Each row opens the call, text or site.
export function SupportLines({ heading, lines }: { heading: string; lines: SupportLine[] }) {
  const { color } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text variant="headline">{heading}</Text>
      <View style={[styles.list, { backgroundColor: color.surface }]}>
        {lines.map((line, i) => (
          <View
            key={line.title}
            style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.hairline }}
          >
            <ListRow
              title={line.title}
              subtitle={line.detail}
              subtitleLines={2}
              chevron
              onPress={() => Linking.openURL(line.url)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  list: { borderRadius: radius.lg, overflow: "hidden" },
});
