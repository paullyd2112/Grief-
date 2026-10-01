import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { Button, Screen, Text, TextField } from "../../src/components/ui";
import { space } from "../../src/theme";

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
    <Screen
      underHeader
      footer={<Button title="Save password" block loading={saving} onPress={handleSave} />}
    >
      <View style={styles.intro}>
        <Text variant="title1" accessibilityRole="header">
          Password
        </Text>
        <Text variant="callout" color="textSecondary">
          Set a password to sign in without waiting for an email code. You can still sign in with
          a code any time, so if you forget your password you won&apos;t be locked out.
        </Text>
        {user?.email && (
          <Text variant="footnote" color="textTertiary">
            Signed in as {user.email}
          </Text>
        )}
      </View>

      <TextField
        label="New password"
        value={password}
        onChangeText={setPasswordDraft}
        placeholder={`At least ${MIN_LENGTH} characters`}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="next"
      />
      <TextField
        label="Type it again"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={handleSave}
        error={error}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm },
});
