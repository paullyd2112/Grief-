import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from "react-native";
import { supabase } from "../lib/supabase";
import { hairlineWidth, radius, space, useTheme } from "../theme";
import { BottomSheet, Button, Text, TextField } from "./ui";

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
  const { color } = useTheme();
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
    <Button
      title="Add a crisis line to my message"
      variant="secondary"
      icon="plus"
      onPress={() => {
        onAddToMessage(CRISIS_LINE_MESSAGE);
        close();
      }}
      style={styles.crisisLine}
    />
  );

  const noteField = (
    <TextField
      label="A note for the team"
      value={note}
      onChangeText={setNote}
      placeholder="Anything you'd like the team to know (optional)"
      multiline
      maxLength={1000}
      editable={teamStatus !== "sending"}
      style={[styles.noteInput, { backgroundColor: color.surface }]}
    />
  );

  const sentCopy = (
    <>
      <Text variant="headline">{"We've let the Ndo team know"}</Text>
      <Text variant="subhead" color="textSecondary">
        {`Your conversation stays open, and ${partnerName} won't be told you reached out.`}
      </Text>
    </>
  );

  return (
    <BottomSheet visible={visible} onClose={close} title={`Worried about ${partnerName}?`}>
      {step === "ask" && (
        <>
          <Text variant="body">
            {`Do you think ${partnerName} might be at risk of harming themselves or someone else?`}
          </Text>
          <View style={styles.choices}>
            <Button title="Yes, right now" variant="destructive" block onPress={chooseUrgent} />
            <Button
              title={"I'm not sure, but I'm worried"}
              variant="secondary"
              block
              onPress={() => setStep("unsure")}
            />
          </View>
        </>
      )}

      {step === "urgent" && (
        <>
          <Text variant="body">
            {`If ${partnerName} may be in danger right now, the most important thing is getting them help. Encourage them to call 911 or 988 right away.`}
          </Text>
          {crisisLineButton}

          <View style={[styles.teamCard, { backgroundColor: color.accentSoft }]}>
            {teamStatus === "sending" && (
              <View style={styles.row}>
                <ActivityIndicator color={color.accent} />
                <Text variant="subhead" color="textSecondary">
                  Letting the Ndo team know…
                </Text>
              </View>
            )}
            {teamStatus === "failed" && (
              <>
                <Text variant="headline">{"We couldn't reach the team"}</Text>
                <Text variant="subhead" color="textSecondary">
                  {"Check your connection and try again. Don't wait on us: if they're in danger, encourage them to call 911 or 988 now."}
                </Text>
                <Button title="Try again" block onPress={() => tellTeam(true, false)} />
              </>
            )}
            {teamStatus === "sent" && (
              <>
                {sentCopy}
                {noteSent ? (
                  <Text variant="subhead" color="textSecondary">
                    Thanks, we have your note.
                  </Text>
                ) : (
                  <>
                    {noteField}
                    <Button
                      title="Add this note"
                      block
                      disabled={!note.trim()}
                      onPress={() => tellTeam(true, true)}
                    />
                  </>
                )}
              </>
            )}
          </View>
        </>
      )}

      {step === "unsure" && (
        <>
          <Text variant="body">
            {"You don't need to be sure. A simple check-in can mean a lot, like “I've been thinking about you. How are you really doing?”"}
          </Text>
          {crisisLineButton}

          <View style={[styles.teamCard, { backgroundColor: color.accentSoft }]}>
            {teamStatus === "sent" ? (
              sentCopy
            ) : (
              <>
                <Text variant="headline">Let the Ndo team know</Text>
                <Text variant="subhead" color="textSecondary">
                  {`We'll see that you're worried about ${partnerName}, and anything you write below. We won't see your conversation, it stays open, and ${partnerName} won't be told you reached out.`}
                </Text>
                {noteField}
                {teamStatus === "failed" && (
                  <Text variant="subhead">{"That didn't go through. Please try again."}</Text>
                )}
                <Button
                  title="Let the team know"
                  block
                  loading={teamStatus === "sending"}
                  onPress={() => tellTeam(false, true)}
                />
              </>
            )}
          </View>
        </>
      )}

      {step !== "ask" && (
        <View style={[styles.selfCare, { borderTopColor: color.hairline }]}>
          <Text variant="headline">Looking after you</Text>
          <Text variant="subhead" color="textSecondary">
            {`This is a lot to carry, especially while you're grieving too. You're not responsible for keeping ${partnerName} safe, and it's okay to step back.`}
          </Text>
          <Pressable onPress={() => Linking.openURL("tel:988")} accessibilityRole="link">
            <Text variant="subheadMedium" color="accent">
              If you need to talk to someone yourself, call or text 988.
            </Text>
          </Pressable>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  choices: { gap: space.sm, marginTop: space.sm },
  crisisLine: { alignSelf: "flex-start" },
  teamCard: { borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  noteInput: { minHeight: 72, textAlignVertical: "top" },
  selfCare: { borderTopWidth: hairlineWidth, paddingTop: space.lg, gap: space.xs },
});
