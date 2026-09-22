import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { supabase } from "../../src/lib/supabase";

interface AccessEntry {
  id: number;
  action: string;
  justification: string;
  created_at: string;
}

export default function MyDataScreen() {
  const { user } = useAuth();
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1C1917" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your data</Text>
      <Text style={styles.intro}>
        Every time a team member accesses information about you, it's logged
        here. This is your record.
      </Text>

      {entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No one has accessed your data yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, badgeStyle(item.action)]}>
                  <Text style={[styles.badgeText, badgeTextStyle(item.action)]}>
                    {item.action}
                  </Text>
                </View>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Text style={styles.justification}>{item.justification}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function badgeStyle(action: string) {
  if (action.includes("report")) return { backgroundColor: "#FEE2E2" };
  if (action.includes("intake")) return { backgroundColor: "#DBEAFE" };
  return { backgroundColor: "#F3F4F6" };
}

function badgeTextStyle(action: string) {
  if (action.includes("report")) return { color: "#991B1B" };
  if (action.includes("intake")) return { color: "#1E40AF" };
  return { color: "#374151" };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAF9",
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1917",
    marginTop: 8,
    marginBottom: 4,
  },
  intro: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#78716C",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: "#A8A29E",
  },
  justification: {
    fontSize: 14,
    color: "#57534E",
    lineHeight: 20,
  },
});
