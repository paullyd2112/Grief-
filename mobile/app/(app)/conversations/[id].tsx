import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAuth } from "../../../src/hooks/useAuth";
import { useMessages } from "../../../src/hooks/useMessages";
import { useConversation } from "../../../src/hooks/useConversation";
import { useVoiceMemo } from "../../../src/hooks/useVoiceMemo";
import { containsContactInfo } from "../../../src/lib/contact-detect";
import { sendErrorMessage } from "../../../src/lib/send-errors";
import { VoiceBubble } from "../../../src/components/VoiceBubble";
import { WorriedSheet } from "../../../src/components/WorriedSheet";
import { supabase } from "../../../src/lib/supabase";
import type { Message } from "../../../src/lib/types";

function formatRecordingTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  if (message.kind === "voice" && message.voice_memo_id) {
    return (
      <VoiceBubble
        voiceMemoId={message.voice_memo_id}
        isOwn={isOwn}
        timestamp={message.created_at}
      />
    );
  }

  return (
    <View
      style={[
        styles.bubble,
        isOwn ? styles.bubbleOwn : styles.bubbleTheirs,
      ]}
    >
      <Text
        style={[styles.bubbleText, isOwn ? styles.textOwn : styles.textTheirs]}
      >
        {message.body}
      </Text>
      <Text
        style={[styles.timestamp, isOwn ? styles.tsOwn : styles.tsTheirs]}
      >
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

function ReportModal({
  visible,
  ended,
  onClose,
  onSubmit,
  loading,
}: {
  visible: boolean;
  ended: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Report this person</Text>
          <Text style={styles.modalSubtitle}>
            {ended
              ? "This will block them. Your recent messages will be saved as a snapshot for review. You can also report something that happened outside the app."
              : "This will block them and end the conversation. Your recent messages will be saved as a snapshot for review."}
          </Text>

          <TextInput
            style={styles.reportInput}
            placeholder="What happened? (optional)"
            placeholderTextColor="#A8A29E"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => onSubmit(reason)}
            disabled={loading}
          >
            <Text style={styles.reportButtonText}>
              {loading ? "Reporting..." : ended ? "Report" : "Report & leave"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { info, loading: convLoading } = useConversation(id, user?.id);
  const { messages, loading: msgsLoading, sendMessage } = useMessages(id);
  const voice = useVoiceMemo(id);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showWorried, setShowWorried] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [contactWarningText, setContactWarningText] = useState<string | null>(
    null
  );
  const inputRef = useRef<TextInput>(null);

  const isEnded = info?.matchEnded || info?.conversationDeleted;

  useEffect(() => {
    if (id) supabase.rpc("mark_read", { conv: id });
  }, [id, messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !user || sending || isEnded) return;

    if (containsContactInfo(trimmed) && !contactWarningText) {
      setContactWarningText(trimmed);
      return;
    }

    setContactWarningText(null);
    setSending(true);
    try {
      await sendMessage(trimmed, user.id);
      setText("");
    } catch (e) {
      Alert.alert("Couldn't send", sendErrorMessage(e));
    } finally {
      setSending(false);
    }
  }, [text, user, sending, isEnded, contactWarningText, sendMessage]);

  const confirmSendWithContact = useCallback(async () => {
    if (!contactWarningText || !user || sending) return;
    setSending(true);
    try {
      await sendMessage(contactWarningText, user.id);
      setText("");
      setContactWarningText(null);
    } catch (e) {
      Alert.alert("Couldn't send", sendErrorMessage(e));
    } finally {
      setSending(false);
    }
  }, [contactWarningText, user, sending, sendMessage]);

  const handleLeave = useCallback(() => {
    if (!id) return;
    Alert.alert(
      "Leave conversation?",
      "Your match will see that you left. You can be matched with someone new.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await supabase.rpc("end_match", { conv: id, silent: false });
            router.replace("/(app)/");
          },
        },
      ]
    );
  }, [id, router]);

  const handleReport = useCallback(
    async (reason: string) => {
      if (!id || !info || !user) return;
      setReporting(true);

      const recentMessages = messages.slice(0, 20).reverse();
      const snapshot = {
        messages: recentMessages.map((m) => ({
          id: m.id,
          sender_id: m.sender_id,
          kind: m.kind,
          body: m.body,
          created_at: m.created_at,
        })),
        reported_at: new Date().toISOString(),
      };

      try {
        const { error } = await supabase.rpc("report_message", {
          conv: id,
          target_user: info.partnerId,
          target_msg: recentMessages.length > 0
            ? recentMessages[recentMessages.length - 1].id
            : null,
          report_reason: reason || null,
          content: snapshot,
          also_leave: true,
        });
        if (error) throw error;
        setShowReport(false);
        Alert.alert(
          "Report received",
          `A person at Ndo will review it. ${info.partnerName} won't be told who reported them.`,
          [{ text: "OK", onPress: () => router.replace("/(app)/") }]
        );
      } catch {
        Alert.alert("Something went wrong", "Please try again.");
      } finally {
        setReporting(false);
      }
    },
    [id, info, user, messages, router]
  );

  const handleBlock = useCallback(() => {
    if (!id || !info) return;
    Alert.alert(
      `Block ${info.partnerName}?`,
      isEnded
        ? "You'll never be matched with them again. This can't be undone."
        : "This ends the conversation and you'll never be matched with them again. They'll see that you left, not that you blocked them. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc("block_user", { conv: id });
            if (error) {
              Alert.alert("Something went wrong", "Please try again.");
              return;
            }
            router.replace("/(app)/");
          },
        },
      ]
    );
  }, [id, info, isEnded, router]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      "Delete conversation?",
      "This permanently removes all messages and voice memos for both of you. This can't be undone.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Delete for both",
          style: "destructive",
          onPress: async () => {
            // Audio must go first: once the conversation is deleted, storage
            // rules stop letting either participant see the files.
            const bucket = supabase.storage.from("voice-memos");
            const { data: files } = await bucket.list(id, { limit: 1000 });
            if (files?.length) {
              await bucket.remove(files.map((f) => `${id}/${f.name}`));
            }
            await supabase.rpc("delete_conversation", { conv: id });
            router.replace("/(app)/");
          },
        },
      ]
    );
  }, [id, router]);

  if (convLoading || msgsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1C1917" />
      </View>
    );
  }

  if (!info) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Conversation not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: info.partnerName,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push("/(app)/crisis")}>
                <Text style={styles.headerHelp}>Get help</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(info.partnerName, undefined, [
                    {
                      text: "I'm worried about them",
                      onPress: () => setShowWorried(true),
                    },
                    ...(isEnded
                      ? []
                      : [
                          {
                            text: "Leave conversation",
                            onPress: handleLeave,
                          } as const,
                        ]),
                    {
                      text: "Block",
                      style: "destructive" as const,
                      onPress: handleBlock,
                    },
                    {
                      text: "Report",
                      style: "destructive" as const,
                      onPress: () => setShowReport(true),
                    },
                    {
                      text: "Delete conversation",
                      style: "destructive" as const,
                      onPress: handleDelete,
                    },
                    { text: "Cancel", style: "cancel" as const },
                  ]);
                }}
              >
                <Text style={styles.headerAction}>···</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.sender_id === user?.id} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Say hello. They're going through something too.
              </Text>
            </View>
          }
        />

        {contactWarningText && (
          <View style={styles.contactWarning}>
            <Text style={styles.contactWarningText}>
              {"Just checking you mean to share this. It looks like contact info, and once it's sent they'll have it. Only share what you're comfortable with."}
            </Text>
            <View style={styles.contactWarningActions}>
              <TouchableOpacity
                onPress={() => setContactWarningText(null)}
                style={styles.contactWarningBtn}
              >
                <Text style={styles.contactWarningBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSendWithContact}
                style={[styles.contactWarningBtn, styles.contactWarningSendBtn]}
              >
                <Text style={styles.contactWarningSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isEnded ? (
          <View style={styles.endedBanner}>
            <Text style={styles.endedText}>This conversation has ended.</Text>
          </View>
        ) : voice.recording ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>
                {formatRecordingTime(voice.durationMs)}
              </Text>
            </View>
            <View style={styles.recordingActions}>
              <TouchableOpacity
                onPress={voice.cancelRecording}
                style={styles.recordingCancelBtn}
              >
                <Text style={styles.recordingCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await voice.stopRecording();
                  if (user) await voice.sendVoiceMemo(user.id);
                }}
                style={styles.recordingStopBtn}
              >
                <Text style={styles.recordingStopText}>
                  {voice.uploading ? "..." : "Send"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TouchableOpacity
              onPress={voice.startRecording}
              disabled={sending || voice.uploading}
              style={[
                styles.micButton,
                (sending || voice.uploading) && styles.sendButtonDisabled,
              ]}
            >
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#A8A29E"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
              editable={!sending && !voice.uploading}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || sending}
              style={[
                styles.sendButton,
                (!text.trim() || sending) && styles.sendButtonDisabled,
              ]}
            >
              <Text style={styles.sendButtonText}>
                {sending ? "..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <ReportModal
        visible={showReport}
        ended={!!isEnded}
        onClose={() => setShowReport(false)}
        onSubmit={handleReport}
        loading={reporting}
      />

      <WorriedSheet
        visible={showWorried}
        partnerName={info.partnerName}
        conversationId={info.conversationId}
        canMessage={!isEnded}
        onClose={() => setShowWorried(false)}
        onAddToMessage={(message) =>
          setText((prev) => (prev.trim() ? `${prev}\n\n${message}` : message))
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAF9",
  },
  errorText: {
    fontSize: 16,
    color: "#78716C",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerHelp: {
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  headerAction: {
    fontSize: 22,
    color: "#1C1917",
    paddingHorizontal: 8,
    letterSpacing: 2,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 2,
  },
  bubbleOwn: {
    backgroundColor: "#3B82F6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: "#E5E7EB",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  textOwn: {
    color: "#FFFFFF",
  },
  textTheirs: {
    color: "#1C1917",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  tsOwn: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  tsTheirs: {
    color: "#6B7280",
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#78716C",
    textAlign: "center",
    lineHeight: 24,
  },
  contactWarning: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
  },
  contactWarningText: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
    marginBottom: 8,
  },
  contactWarningActions: {
    flexDirection: "row",
    gap: 8,
  },
  contactWarningBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FDE68A",
  },
  contactWarningBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  contactWarningSendBtn: {
    backgroundColor: "#92400E",
  },
  contactWarningSendText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  endedBanner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F4",
    borderTopWidth: 1,
    borderTopColor: "#E7E5E4",
    alignItems: "center",
  },
  endedText: {
    fontSize: 15,
    color: "#78716C",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E7E5E4",
    backgroundColor: "#fff",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F4",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: "#1C1917",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F4",
    justifyContent: "center",
    alignItems: "center",
  },
  micIcon: {
    fontSize: 18,
  },
  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E7E5E4",
    backgroundColor: "#FEF2F2",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#DC2626",
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
    fontVariant: ["tabular-nums"],
  },
  recordingActions: {
    flexDirection: "row",
    gap: 8,
  },
  recordingCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  recordingCancelText: {
    fontSize: 15,
    color: "#78716C",
    fontWeight: "500",
  },
  recordingStopBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
  },
  recordingStopText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
    marginBottom: 16,
  },
  reportInput: {
    backgroundColor: "#F5F5F4",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1C1917",
    textAlignVertical: "top",
    minHeight: 80,
    marginBottom: 16,
  },
  reportButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  reportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#78716C",
  },
});
