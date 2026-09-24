import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { supabase } from "../../src/lib/supabase";
import { CODE_OF_CONDUCT_URL } from "../../src/lib/config";

// A short summary of the Ndo Code of Conduct. Keep the two in step.
const sections = [
  {
    title: "Listen more than you advise",
    body: "People are here to be heard, not fixed. If you're not sure what someone needs, ask. Nobody here should tell anyone how they \"should\" grieve or feel.",
  },
  {
    title: "Grief isn't a competition",
    body: "Relating to someone's loss is natural. Let them decide how similar your losses are, and take care comparing very different kinds of loss.",
  },
  {
    title: "Respect every way of mourning",
    body: "Members come from every faith and none. Keep talk of religion, an afterlife, or grief timelines optional, never prescriptive. Use a content note before describing a death in graphic detail.",
  },
  {
    title: "Keep it private",
    body: "What's shared in a conversation stays there. Don't screenshot, forward, or repeat someone's story outside Ndo, unless you're reporting harm or a safety risk.",
  },
  {
    title: "Share at your own pace",
    body: "Your last name, location, photos, and social handles are yours to share or not. Never pressure anyone to share more than they want to.",
  },
  {
    title: "Not allowed on Ndo",
    body: "Harassment, hate, or discrimination. Romantic or sexual advances. Selling, fundraising, or soliciting. Pretending to be a counselor, therapist, or medical professional. Encouraging self-harm. Threats of any kind. Knowingly false reports.",
  },
  {
    title: "Leave, block, or report whenever you need to",
    body: "You can end a match at any time, no explanation needed, and ask for a new one. Blocking is permanent and doesn't need a report. Reports are confidential, and every one is reviewed by a person, never by AI.",
  },
  {
    title: "This is peer support, not therapy or a crisis service",
    body: "Nobody here is expected to talk someone through a crisis. If you or your match are in danger, call or text 988 or call 911. Crisis resources are always one tap away.",
  },
  {
    title: "What happens if someone breaks these",
    body: "Depending on how serious it is, a warning, a suspension, or a permanent ban. You can appeal any decision by contacting Ndo support.",
  },
];

export default function GuidelinesScreen() {
  const { user } = useAuth();
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
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Community guidelines</Text>
      <Text style={styles.intro}>
        {"Everyone on Ndo agrees to the Code of Conduct. Here's the short version. It exists to keep this a place where people can be honest about what they're carrying."}
      </Text>

      {sections.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.sectionBody}>{s.body}</Text>
        </View>
      ))}

      {CODE_OF_CONDUCT_URL && (
        <TouchableOpacity onPress={() => Linking.openURL(CODE_OF_CONDUCT_URL)}>
          <Text style={styles.fullLink}>Read the full Code of Conduct</Text>
        </TouchableOpacity>
      )}

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
  fullLink: {
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "600",
    marginBottom: 8,
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
