import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { supabase } from "../../src/lib/supabase";
import { Icon, Screen, Text } from "../../src/components/ui";
import { hairlineWidth, radius, space, useTheme } from "../../src/theme";

interface AccessEntry {
  id: number;
  action: string;
  justification: string;
  created_at: string;
}

export default function MyDataScreen() {
  const { user } = useAuth();
  const { color } = useTheme();
  const [entries, setEntries] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from("access_log")
        .select("id, action, justification, created_at")
        .eq("subject_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setEntries(data ?? []);
      setLoading(false);
    };

    load();
  }, [user]);

  return (
    <Screen underHeader>
      <View style={styles.intro}>
        <Text variant="title1" accessibilityRole="header">
          Your data
        </Text>
        <Text variant="callout" color="textSecondary">
          Every time a team member accesses information about you, it&apos;s logged here. This is
          your record.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={color.textSecondary} style={styles.loading} />
      ) : entries.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: color.surface }]}>
          <Icon name="lock" size={22} color={color.textTertiary} />
          <Text variant="callout" color="textSecondary" align="center">
            No one has accessed your data yet.
          </Text>
        </View>
      ) : (
        <View style={[styles.list, { backgroundColor: color.surface }]}>
          {entries.map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.entry,
                i > 0 && { borderTopWidth: hairlineWidth, borderTopColor: color.hairline },
              ]}
            >
              <View style={styles.entryHeader}>
                <Text variant="subheadMedium" style={styles.action}>
                  {item.action.replace(/_/g, " ")}
                </Text>
                <Text variant="footnote" color="textTertiary">
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Text variant="subhead" color="textSecondary">
                {item.justification}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm },
  loading: { marginTop: space.xxl },
  empty: {
    borderRadius: radius.lg,
    padding: space.xxl,
    alignItems: "center",
    gap: space.sm,
  },
  list: { borderRadius: radius.lg, overflow: "hidden" },
  entry: { padding: space.lg, gap: space.xs },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: space.md },
  action: { flex: 1, textTransform: "capitalize" },
});
