import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useGate } from "../../src/hooks/useGate";

/**
 * Profile creation — Reddit model. One display_name field.
 * Real name or pseudonym, user's choice. The product never distinguishes
 * or verifies, and never uses this for ranking, matching, or trust scoring.
 */
export default function CreateProfileScreen() {
  const { user, refreshGate } = useGate();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [isPseudonym, setIsPseudonym] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 32) {
      Alert.alert("Name must be between 2 and 32 characters.");
      return;
    }

    setLoading(true);

    // Get the DOB they entered at the age gate
    const { data: dob } = await supabase
      .from("dob_attempts")
      .select("date_of_birth")
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      display_name: name,
      name_is_pseudonym: isPseudonym,
      date_of_birth: dob?.date_of_birth ?? "1900-01-01",
    });

    if (error && error.code !== "23505") {
      setLoading(false);
      Alert.alert("Something went wrong", error.message);
      return;
    }

    // 23505 means the profile already exists, which is fine: move on.
    await refreshGate();
    setLoading(false);
    router.replace("/(app)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>What should people call you?</Text>
        <Text style={styles.subtitle}>
          Use your real name or make one up — whatever feels right. You can
          change it later.
        </Text>

        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name or a pseudonym"
          placeholderTextColor="#A8A29E"
          autoCapitalize="words"
          maxLength={32}
          returnKeyType="go"
          onSubmitEditing={handleCreate}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>This is a pseudonym</Text>
          <Switch
            value={isPseudonym}
            onValueChange={setIsPseudonym}
            trackColor={{ false: "#D6D3D1", true: "#1C1917" }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.note}>
          This is just for your display name. It doesn't affect matching or how
          we treat your account.
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#57534E",
    lineHeight: 24,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: "#1C1917",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 15,
    color: "#44403C",
  },
  note: {
    fontSize: 13,
    color: "#A8A29E",
    lineHeight: 18,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#1C1917",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
