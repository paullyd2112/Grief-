import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

/**
 * Conversation screen placeholder — Phase 3 builds this out with:
 * - Realtime messaging via Supabase
 * - Report / block / end-match actions
 * - Contact-info detection warning on send
 * - Departure notice rendering (D11)
 * - Voice memo send/playback (Phase 4)
 */
export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>
        Messaging is coming in the next phase.
      </Text>
      <Text style={styles.conversationId}>Conversation: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  placeholder: {
    fontSize: 17,
    color: "#57534E",
    textAlign: "center",
  },
  conversationId: {
    fontSize: 12,
    color: "#A8A29E",
    marginTop: 12,
  },
});
