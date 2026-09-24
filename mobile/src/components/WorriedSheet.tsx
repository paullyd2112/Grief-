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
} from "react-native";
import { supabase } from "../lib/supabase";

export const CRISIS_LINE_MESSAGE =
  "I care about you, and I want you to have this. You can call or text 988 any time, day or night, to talk with someone trained to help. You can also text HELLO to 741741. If you're in danger right now, please call 911.";

type Step = "ask" | "urgent" | "unsure";
type TeamStatus = "idle" | "sending" | "sent" | "failed";

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
  const [step, setStep] = useState<Step>("ask");
  const [note, setNote] = useState("");
  const [teamStatus, setTeamStatus] = useState<TeamStatus>("idle");
  const [noteSent, setNoteSent] = useState(false);

  const tellTeam = async (urgent: boolean, withNote: boolean) => {
    setTeamStatus("sending");
    const { error } = await supabase.rpc("raise_concern", {
      conv: conversationId,
      concern_note: withNote ? note.trim() || null : null,
      is_urgent: urgent,
    });
    if (error) {
      setTeamStatus("failed");
      return;
    }
    setTeamStatus("sent");
    if (withNote && note.trim()) setNoteSent(true);
  };

  const chooseUrgent = () => {
    setStep("urgent");
    tellTeam(true, false);
  };

  const close = () => {
    setStep("ask");
    setNote("");
    setTeamStatus("idle");
    setNoteSent(false);
    onClose();
  };

  const crisisLineButton = canMessage && (
    <TouchableOpacity
      style={styles.secondaryButton}
      onPress={() => {
        onAddToMessage(CRISIS_LINE_MESSAGE);
        close();
      }}
    >
      <Text style={styles.secondaryButtonText}>Add a crisis line to my message</Text>
    </TouchableOpacity>
  );

  const noteField = (
    <TextInput
      style={styles.noteInput}
      value={note}
      onChangeText={setNote}
      placeholder="Anything you'd like the team to know (optional)"
      placeholderTextColor="#A8A29E"
      multiline
      maxLength={1000}
      editable={teamStatus !== "sending"}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{`Worried about ${partnerName}?`}</Text>

            {step === "ask" && (
              <>
                <Text style={styles.question}>
                  {`Do you think ${partnerName} might be at risk of harming themselves or someone else?`}
                </Text>
                <TouchableOpacity style={styles.urgentChoice} onPress={chooseUrgent}>
                  <Text style={styles.urgentChoiceText}>Yes, right now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.choice} onPress={() => setStep("unsure")}>
                  <Text style={styles.choiceText}>{"I'm not sure, but I'm worried"}</Text>
                </TouchableOpacity>
              </>
            )}

            {step === "urgent" && (
              <>
                <Text style={styles.body}>
                  {`If ${partnerName} may be in danger right now, the most important thing is getting them help. Encourage them to call 911 or 988 right away.`}
                </Text>
                {crisisLineButton}

                <View style={styles.teamCard}>
                  {teamStatus === "sending" && (
                    <View style={styles.row}>
                      <ActivityIndicator color="#1E40AF" />
                      <Text style={styles.teamBody}>Letting the Ndo team know…</Text>
                    </View>
                  )}
                  {teamStatus === "failed" && (
                    <>
                      <Text style={styles.teamTitle}>{"We couldn't reach the team"}</Text>
                      <Text style={styles.teamBody}>
                        {"Check your connection and try again. Don't wait on us: if they're in danger, encourage them to call 911 or 988 now."}
                      </Text>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => tellTeam(true, false)}
                      >
                        <Text style={styles.primaryButtonText}>Try again</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {teamStatus === "sent" && (
                    <>
                      <Text style={styles.teamTitle}>{"We've let the Ndo team know"}</Text>
                      <Text style={styles.teamBody}>
                        {`Your conversation stays open, and ${partnerName} won't be told you reached out.`}
                      </Text>
                      {noteSent ? (
                        <Text style={styles.teamBody}>Thanks, we have your note.</Text>
                      ) : (
                        <>
                          {noteField}
                          <TouchableOpacity
                            style={[styles.primaryButton, !note.trim() && styles.disabled]}
                            onPress={() => tellTeam(true, true)}
                            disabled={!note.trim()}
                          >
                            <Text style={styles.primaryButtonText}>Add this note</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}
                </View>
              </>
            )}

            {step === "unsure" && (
              <>
                <Text style={styles.body}>
                  {"You don't need to be sure. A simple check-in can mean a lot, like “I've been thinking about you. How are you really doing?”"}
                </Text>
                {crisisLineButton}

                <View style={styles.teamCard}>
                  {teamStatus === "sent" ? (
                    <>
                      <Text style={styles.teamTitle}>{"We've let the Ndo team know"}</Text>
                      <Text style={styles.teamBody}>
                        {`Your conversation stays open, and ${partnerName} won't be told you reached out.`}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.teamTitle}>Let the Ndo team know</Text>
                      <Text style={styles.teamBody}>
                        {`We'll see that you're worried about ${partnerName}, and anything you write below. We won't see your conversation, it stays open, and ${partnerName} won't be told you reached out.`}
                      </Text>
                      {noteField}
                      {teamStatus === "failed" && (
                        <Text style={styles.errorText}>
                          {"That didn't go through. Please try again."}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={[styles.primaryButton, teamStatus === "sending" && styles.disabled]}
                        onPress={() => tellTeam(false, true)}
                        disabled={teamStatus === "sending"}
                      >
                        {teamStatus === "sending" ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Let the team know</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}

            {step !== "ask" && (
              <View style={styles.selfCare}>
                <Text style={styles.selfCareTitle}>Looking after you</Text>
                <Text style={styles.selfCareBody}>
                  {`This is a lot to carry, especially while you're grieving too. You're not responsible for keeping ${partnerName} safe, and it's okay to step back.`}
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL("tel:988")}>
                  <Text style={styles.selfCareLink}>
                    If you need to talk to someone yourself, call or text 988.
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
    marginBottom: 12,
  },
  question: {
    fontSize: 17,
    color: "#1C1917",
    lineHeight: 24,
    marginBottom: 20,
  },
  urgentChoice: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  urgentChoiceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  choice: {
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 16,
  },
  choiceText: {
    color: "#1C1917",
    fontSize: 16,
    fontWeight: "500",
  },
  body: {
    fontSize: 16,
    color: "#44403C",
    lineHeight: 24,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
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
    marginTop: 20,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
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
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
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
    borderTopWidth: 1,
    borderTopColor: "#E7E5E4",
    marginTop: 24,
    paddingTop: 16,
  },
  selfCareTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 4,
  },
  selfCareBody: {
    fontSize: 14,
    color: "#57534E",
    lineHeight: 20,
    marginBottom: 6,
  },
  selfCareLink: {
    fontSize: 14,
    color: "#3B82F6",
    lineHeight: 20,
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  closeText: {
    fontSize: 16,
    color: "#78716C",
  },
});
