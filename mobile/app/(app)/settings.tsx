import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { useProfile } from "../../src/hooks/useProfile";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Display name</Text>
        <Text style={styles.value}>{profile?.display_name ?? "—"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{user?.email ?? "—"}</Text>
      </View>

      <TouchableOpacity
        style={styles.dangerButton}
        onPress={() =>
          Alert.alert(
            "Sign out?",
            "You can sign back in anytime.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: signOut },
            ]
          )
        }
      >
        <Text style={styles.dangerText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        If you're in crisis, call or text 988.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  label: {
    fontSize: 13,
    color: "#78716C",
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    color: "#1C1917",
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  dangerText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    textAlign: "center",
    color: "#A8A29E",
    fontSize: 13,
    marginTop: 32,
  },
});
