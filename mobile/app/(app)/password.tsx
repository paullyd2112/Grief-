import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";

const MIN_LENGTH = 8;

// Set or change the password used for "Sign in with a password". Signing in
// with an email code keeps working either way, so a forgotten password is
// never a lockout.
export default function PasswordScreen() {
  const router = useRouter();
  const { user, setPassword } = useAuth();
  const [password, setPasswordDraft] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (saving) return;
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setSaving(true);
    setError(null);
    const { error: err } = await setPassword(password);
    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    Alert.alert(
      "Password saved",
      "You can now sign in with your email and this password, or with an email code.",
      [{ text: "Done", onPress: () => router.back() }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Set a password to sign in without waiting for an email code. You can
        still sign in with a code any time, so if you forget your password
        you won&apos;t be locked out.
      </Text>

      {user?.email && <Text style={styles.email}>Signed in as {user.email}</Text>}

      <Text style={styles.label}>New password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPasswordDraft}
        placeholder={`At least ${MIN_LENGTH} characters`}
        placeholderTextColor="#A8A29E"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="next"
      />

      <Text style={styles.label}>Type it again</Text>
      <TextInput
        style={styles.input}
        value={confirm}
        onChangeText={setConfirm}
        placeholderTextColor="#A8A29E"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save password</Text>
        )}
      </TouchableOpacity>
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
  intro: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
    marginBottom: 16,
  },
  email: {
    fontSize: 14,
    color: "#78716C",
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: "#44403C",
    marginBottom: 8,
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
  error: {
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 16,
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
