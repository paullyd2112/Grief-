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
import { supabase } from "../../src/lib/supabase";

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Tell us what you think</Text>
      <Text style={styles.intro}>
        {"Ndo is in beta, and every piece of feedback is read by a person. Tell us what's working, what isn't, and what you wish existed."}
      </Text>

      <TextInput
        style={styles.input}
        value={body}
        onChangeText={setBody}
        placeholder="Your feedback"
        placeholderTextColor="#A8A29E"
        multiline
        maxLength={MAX_LENGTH}
        textAlignVertical="top"
        editable={!sending}
      />

      <TouchableOpacity
        style={[styles.sendButton, (!body.trim() || sending) && styles.sendDisabled]}
        onPress={handleSend}
        disabled={!body.trim() || sending}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendText}>Send feedback</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>
        {"To report someone, use Report inside the conversation instead, so it reaches review right away. If you're in crisis, use Crisis help on the home screen."}
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
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1917",
    marginTop: 8,
    marginBottom: 8,
  },
  intro: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1C1917",
    minHeight: 160,
    marginBottom: 16,
  },
  sendButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    fontSize: 13,
    color: "#A8A29E",
    lineHeight: 18,
    marginTop: 20,
    textAlign: "center",
  },
});
