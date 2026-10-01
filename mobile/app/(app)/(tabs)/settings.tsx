import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/hooks/useAuth";
import { useProfile } from "../../../src/hooks/useProfile";
import { supabase } from "../../../src/lib/supabase";
import { getShowRightAway, setShowRightAway } from "../../../src/lib/media";
import {
  Avatar,
  BottomSheet,
  Button,
  LargeTitleHeader,
  ListGroup,
  ListRow,
  Text,
  TextField,
} from "../../../src/components/ui";
import { gutter, space, useTheme } from "../../../src/theme";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile, refetch } = useProfile(user?.id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showMedia, setShowMedia] = useState(false);

  useEffect(() => {
    getShowRightAway().then(setShowMedia);
  }, []);

  const saveName = async () => {
    if (!user || nameDraft === null) return;
    const name = nameDraft.trim();
    if (name.length < 2 || name.length > 32) {
      setNameError("Name must be between 2 and 32 characters.");
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

  const confirmSignOut = () =>
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);

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

  const name = profile?.display_name ?? "";

  return (
    <View style={[styles.fill, { backgroundColor: color.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: space.huge }}
      >
        <LargeTitleHeader title="You" />

        <View style={styles.profile}>
          {user && <Avatar seed={user.id} name={name} size={64} />}
          <View style={styles.profileText}>
            <Text variant="title2" numberOfLines={1}>
              {name || "—"}
            </Text>
            <Text variant="subhead" color="textSecondary" numberOfLines={1}>
              {user?.email ?? ""}
            </Text>
          </View>
        </View>

        <ListGroup header="Account">
          <ListRow
            title="Display name"
            trailing={name}
            chevron
            onPress={() => {
              setNameError(null);
              setNameDraft(name);
            }}
          />
          <ListRow
            title="Password"
            chevron
            onPress={() => router.push("/(app)/password")}
          />
        </ListGroup>

        {profile?.guidelines_accepted_at && (
          <ListGroup header="Matching">
            <ListRow
              title="Update your intake"
              subtitle="If your situation or preferences have changed"
              subtitleLines={2}
              chevron
              onPress={() => router.push("/(app)/intake")}
            />
          </ListGroup>
        )}

        <ListGroup
          header="Conversations"
          footer="Off: they open when you tap them, so you can choose when you're ready."
        >
          <ListRow
            title="Show photos and videos right away"
            titleLines={2}
            trailing={
              <Switch
                value={showMedia}
                onValueChange={(value) => {
                  setShowMedia(value);
                  setShowRightAway(value);
                }}
                trackColor={{ false: color.hairline, true: color.accentFill }}
                accessibilityLabel="Show photos and videos right away"
              />
            }
          />
        </ListGroup>

        <ListGroup header="Support and safety">
          <ListRow title="Crisis resources" chevron onPress={() => router.push("/(app)/crisis")} />
          <ListRow
            title="Community guidelines"
            chevron
            onPress={() => router.push("/(app)/guidelines")}
          />
          <ListRow title="Send feedback" chevron onPress={() => router.push("/(app)/feedback")} />
        </ListGroup>

        <ListGroup header="Privacy">
          <ListRow title="Your data" chevron onPress={() => router.push("/(app)/my-data")} />
        </ListGroup>

        <ListGroup>
          <ListRow title="Sign out" onPress={confirmSignOut} />
        </ListGroup>

        <View style={styles.bottom}>
          <Button title="Delete account" variant="quiet" onPress={confirmDeleteAccount} />
          <Text variant="footnote" color="textTertiary" align="center">
            {"If you're in crisis, call or text 988."}
          </Text>
        </View>
      </ScrollView>

      <BottomSheet
        visible={nameDraft !== null}
        onClose={() => setNameDraft(null)}
        title="Display name"
      >
        <View style={styles.sheet}>
          <TextField
            label="What should people call you?"
            value={nameDraft ?? ""}
            onChangeText={(text) => {
              setNameDraft(text);
              if (nameError) setNameError(null);
            }}
            autoFocus
            autoCapitalize="words"
            maxLength={32}
            returnKeyType="done"
            onSubmitEditing={saveName}
            editable={!saving}
            error={nameError}
            helper="Your real name or one you make up. It doesn't affect matching."
          />
          <Button title="Save" block loading={saving} onPress={saveName} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    paddingHorizontal: gutter,
    paddingBottom: space.xxl,
  },
  profileText: { flex: 1, gap: space.xxs },
  bottom: { alignItems: "center", gap: space.lg, paddingHorizontal: gutter },
  sheet: { gap: space.lg },
});
