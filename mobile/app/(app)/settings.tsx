import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { useProfile } from "../../src/hooks/useProfile";
import { supabase } from "../../src/lib/supabase";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile, refetch } = useProfile(user?.id);
  const router = useRouter();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    if (!user || nameDraft === null) return;
    const name = nameDraft.trim();
    if (name.length < 2 || name.length > 32) {
      Alert.alert("Name must be between 2 and 32 characters.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      Alert.alert("Something went wrong", "Please try again.");
      return;
    }
    await refetch();
    setNameDraft(null);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "Any conversations you're in will end, and you'll be signed out. Your account and everything in it are permanently deleted after 30 days. Signing back in before then lets you keep it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc("delete_my_account");
            if (error) {
              Alert.alert("Something went wrong", "Please try again.");
              return;
            }
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>Display name</Text>
          {nameDraft === null ? (
            <TouchableOpacity onPress={() => setNameDraft(profile?.display_name ?? "")}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setNameDraft(null)} disabled={saving}>
              <Text style={styles.editLink}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
        {nameDraft === null ? (
          <Text style={styles.value}>{profile?.display_name ?? "—"}</Text>
        ) : (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              autoCapitalize="words"
              maxLength={32}
              returnKeyType="done"
              onSubmitEditing={saveName}
              editable={!saving}
            />
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={saveName}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? "..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{user?.email ?? "—"}</Text>
      </View>

      {profile?.guidelines_accepted_at && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Matching</Text>
          </View>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push("/(app)/intake")}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.linkText}>Update your intake</Text>
              <Text style={styles.linkSubtext}>
                If your situation or preferences have changed
              </Text>
            </View>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Support & Safety</Text>
      </View>

      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => router.push("/(app)/crisis")}
      >
        <Text style={styles.linkText}>Crisis resources</Text>
        <Text style={styles.linkArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => router.push("/(app)/guidelines")}
      >
        <Text style={styles.linkText}>Community guidelines</Text>
        <Text style={styles.linkArrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Privacy</Text>
      </View>

      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => router.push("/(app)/my-data")}
      >
        <Text style={styles.linkText}>Your data</Text>
        <Text style={styles.linkArrow}>›</Text>
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.deleteButton} onPress={confirmDeleteAccount}>
        <Text style={styles.deleteText}>Delete account</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        If you're in crisis, call or text 988.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editLink: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
    marginBottom: 4,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 17,
    color: "#1C1917",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteButton: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  deleteText: {
    color: "#DC2626",
    fontSize: 15,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#78716C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linkRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: {
    fontSize: 16,
    color: "#1C1917",
  },
  linkSubtext: {
    fontSize: 13,
    color: "#78716C",
    marginTop: 2,
  },
  linkArrow: {
    fontSize: 20,
    color: "#A8A29E",
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
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
