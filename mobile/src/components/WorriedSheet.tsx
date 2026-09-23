import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";

export const CRISIS_LINE_MESSAGE =
  "I care about you, and I want you to have this. You can call or text 988 any time, day or night, to talk with someone trained to help. You can also text HELLO to 741741. If you're in danger right now, please call 911.";

export function WorriedSheet({
  visible,
  partnerName,
  conversationId,
  canMessage,
  onClose,
  onAddToMessage,
}: {
  visible: boolean;
  partnerName: string;
  conversationId: string;
  canMessage: boolean;
  onClose: () => void;
  onAddToMessage: (text: string) => void;
}) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const letTeamKnow = async () => {
    setSending(true);
    const { error } = await supabase.rpc("raise_concern", {
      conv: conversationId,
      concern_note: note.trim() || null,
    });
    setSending(false);
    if (error) {
      Alert.alert("That didn't go through", "Please try again. If they're in danger right now, call 911.");
      return;
    }
    setSent(true);
  };

  const close = () => {
    setNote("");
    setSent(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{`Worried about ${partnerName}?`}</Text>
            <Text style={styles.intro}>
              {"Thank you for caring. You don't need the perfect words, and you don't have to handle this alone."}
            </Text>

            <View style={styles.step}>
              <Text style={styles.stepTitle}>Ask them directly</Text>
              <Text style={styles.stepBody}>
                {"If you think they might be thinking about suicide, it's okay to ask: “Are you thinking about ending your life?” Asking doesn't put the idea in their head, and it often brings relief."}
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepTitle}>Listen</Text>
              <Text style={styles.stepBody}>
                {"You don't have to fix anything. Letting them know you're here and you're listening matters."}
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepTitle}>Share a crisis line</Text>
              <Text style={styles.stepBody}>
                988 is free, confidential, and open around the clock, by call or text.
              </Text>
              {canMessage && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    onAddToMessage(CRISIS_LINE_MESSAGE);
                    close();
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Add it to my message</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.step}>
              <Text style={styles.stepTitle}>
                {"If they say they're in danger right now"}
              </Text>
              <Text style={styles.stepBody}>
                Encourage them to call 911 or 988 immediately.
              </Text>
            </View>

            <View style={styles.teamCard}>
              {sent ? (
                <>
                  <Text style={styles.teamTitle}>{"We've let the team know"}</Text>
                  <Text style={styles.teamBody}>
                    {`Thank you for looking out for ${partnerName}. Your conversation stays open.`}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.teamTitle}>Let the Ndo team know</Text>
                  <Text style={styles.teamBody}>
                    {`We'll see that you're worried about ${partnerName}, and anything you write below. We won't see your conversation, it stays open, and ${partnerName} won't be told you reached out.`}
                  </Text>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Anything you'd like us to know (optional)"
                    placeholderTextColor="#A8A29E"
                    multiline
                    maxLength={1000}
                    editable={!sending}
                  />
                  <TouchableOpacity
                    style={[styles.primaryButton, sending && styles.disabled]}
                    onPress={letTeamKnow}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Let the team know</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity onPress={() => Linking.openURL("tel:988")}>
              <Text style={styles.selfCare}>
                {"Look after yourself too. Supporting someone through this is heavy, and you can call or text 988 for yourself as well."}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={close}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 8,
  },
  intro: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
    marginBottom: 20,
  },
  step: {
    marginBottom: 18,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 4,
  },
  stepBody: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },
  teamCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 6,
  },
  teamBody: {
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
  },
  noteInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 12,
    fontSize: 15,
    color: "#1C1917",
    minHeight: 72,
    textAlignVertical: "top",
    marginTop: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selfCare: {
    fontSize: 14,
    color: "#78716C",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 12,
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  closeText: {
    fontSize: 16,
    color: "#78716C",
  },
});
