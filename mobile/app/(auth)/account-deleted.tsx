import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Screen, Text } from "../../src/components/ui";
import { space } from "../../src/theme";
import { useAuth } from "../../src/hooks/useAuth";
import { useGate } from "../../src/hooks/useGate";
import { supabase } from "../../src/lib/supabase";

const GRACE_DAYS = 30;

export default function AccountDeletedScreen() {
  const { signOut } = useAuth();
  const { gate, refreshGate } = useGate();
  const [restoring, setRestoring] = useState(false);

  const deleteOn = gate?.deletedAt
    ? new Date(new Date(gate.deletedAt).getTime() + GRACE_DAYS * 86_400_000)
    : null;

  const keepAccount = async () => {
    setRestoring(true);
    const { error } = await supabase.rpc("restore_my_account");
    if (error) {
      setRestoring(false);
      Alert.alert("Something went wrong", "Please try again.");
      return;
    }
    await refreshGate();
  };

  return (
    <Screen
      centered
      footer={
        <>
          <Button title="Keep my account" block loading={restoring} onPress={keepAccount} />
          <Button title="Sign out" variant="quiet" block onPress={signOut} />
        </>
      }
    >
      <View style={styles.intro}>
        <Text variant="title1" accessibilityRole="header">
          Your account is being deleted
        </Text>
        <Text variant="callout" color="textSecondary">
          {deleteOn
            ? `It will be permanently deleted on ${deleteOn.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}. Until then you can change your mind.`
            : "Until it's permanently deleted, you can change your mind."}
        </Text>
        <Text variant="callout" color="textSecondary">
          {"If you keep it, you'll go back into the queue to be matched. Conversations that ended when you deleted your account won't come back."}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.md },
});
