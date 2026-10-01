import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { Button, Screen, Text, TextField } from "../../src/components/ui";
import { space } from "../../src/theme";

const MAX_LENGTH = 4000;

export default function FeedbackScreen() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const { error } = await supabase.from("feedback").insert({ body: trimmed });
    setSending(false);

    if (error) {
      Alert.alert(
        "Couldn't send",
        error.message.startsWith("rate_limited")
          ? "You've sent a lot of feedback today. Try again tomorrow."
          : "Check your connection and try again."
      );
      return;
    }

    setBody("");
    Alert.alert(
      "Thank you",
      "A person reads every piece of feedback. It shapes what Ndo becomes.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <Screen
      underHeader
      footer={
        <Button
          title="Send feedback"
          block
          loading={sending}
          disabled={!body.trim()}
          onPress={handleSend}
        />
      }
    >
      <View style={styles.intro}>
        <Text variant="title1" accessibilityRole="header">
          Tell us what you think
        </Text>
        <Text variant="callout" color="textSecondary">
          {"Ndo is in beta, and every piece of feedback is read by a person. Tell us what's working, what isn't, and what you wish existed."}
        </Text>
      </View>

      <TextField
        label="Your feedback"
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={MAX_LENGTH}
        textAlignVertical="top"
        editable={!sending}
        style={styles.input}
      />

      <Text variant="footnote" color="textTertiary">
        {"To report someone, use Report inside the conversation instead, so it reaches review right away. If you're in crisis, use Crisis help on the home screen."}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm },
  input: { minHeight: 160 },
});
