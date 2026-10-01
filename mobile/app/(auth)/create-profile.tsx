import { useState } from "react";
import { Alert, StyleSheet, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useGate } from "../../src/hooks/useGate";
import { Button, Screen, Text, TextField } from "../../src/components/ui";
import { space, useTheme } from "../../src/theme";

/**
 * Profile creation — Reddit model. One display_name field.
 * Real name or pseudonym, user's choice. The product never distinguishes
 * or verifies, and never uses this for ranking, matching, or trust scoring.
 */
export default function CreateProfileScreen() {
  const { user, refreshGate } = useGate();
  const router = useRouter();
  const { color } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [isPseudonym, setIsPseudonym] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!user) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 32) {
      setNameError("Name must be between 2 and 32 characters.");
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
    router.replace("/(app)/(tabs)");
  };

  return (
    <Screen
      footer={<Button title="Continue" block loading={loading} onPress={handleCreate} />}
    >
      <View style={styles.intro}>
        <Text variant="title1" accessibilityRole="header">
          What should people call you?
        </Text>
        <Text variant="callout" color="textSecondary">
          Use your real name or make one up — whatever feels right. You can change it later.
        </Text>
      </View>

      <TextField
        label="Name"
        value={displayName}
        onChangeText={(text) => {
          setDisplayName(text);
          if (nameError) setNameError(null);
        }}
        placeholder="Your name or a pseudonym"
        autoCapitalize="words"
        maxLength={32}
        returnKeyType="go"
        onSubmitEditing={handleCreate}
        error={nameError}
      />

      <View style={styles.switchRow}>
        <Text variant="body" style={styles.switchLabel}>
          This is a pseudonym
        </Text>
        <Switch
          value={isPseudonym}
          onValueChange={setIsPseudonym}
          trackColor={{ false: color.hairline, true: color.accentFill }}
          accessibilityLabel="This is a pseudonym"
        />
      </View>

      <Text variant="footnote" color="textTertiary">
        This is just for your display name. It doesn&apos;t affect matching or how we treat your
        account.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm },
  switchRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  switchLabel: { flex: 1 },
});
