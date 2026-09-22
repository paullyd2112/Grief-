import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { useProfile } from "../../src/hooks/useProfile";
import { supabase } from "../../src/lib/supabase";

const sections = [
  {
    title: "Be kind",
    body: "Everyone here is grieving. Treat every person with the same gentleness you'd want for yourself on your worst day.",
  },
  {
    title: "Keep it private",
    body: "What's shared in a conversation stays there. Don't screenshot, copy, or repeat what someone tells you — not even to mutual friends.",
  },
  {
    title: "No contact info",
    body: "Don't share phone numbers, emails, social handles, or addresses. This protects both of you. The app will warn you if it detects contact information in a message.",
  },
  {
    title: "You can always leave",
    body: "If a conversation isn't working for you, you can leave at any time — no explanation needed. The other person will see that you left, not why.",
  },
  {
    title: "Report anything that feels wrong",
    body: "If someone is unkind, pressuring, or makes you uncomfortable, report the message. Your report is confidential — the other person is never told.",
  },
  {
    title: "This is peer support, not therapy",
    body: "Ndo connects you with someone who understands. It is not a substitute for professional help. If you're in crisis, tap the crisis resources link in Settings.",
  },
  {
    title: "Be yourself",
    body: "You can use your real name or a pseudonym — your choice. Either way, be honest about your experience. Pretending to have lost someone you haven't helps nobody.",
  },
];

export default function GuidelinesScreen() {
  const { user } = useAuth();
  const { refetch: refetchProfile } = useProfile(user?.id);
  const router = useRouter();

  const acceptGuidelines = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ guidelines_accepted_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      Alert.alert("Something went wrong", "Please try again.");
      return;
    }
    await refetchProfile();
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Community guidelines</Text>
      <Text style={styles.intro}>
        These are the ground rules for every conversation on Ndo. By using the
        app, you agree to follow them.
      </Text>

      {sections.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.sectionBody}>{s.body}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.acceptButton} onPress={acceptGuidelines}>
        <Text style={styles.acceptText}>I understand and agree</Text>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
  },
  acceptButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  acceptText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
