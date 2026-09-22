import { useState, useRef, useCallback } from "react";
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
import { containsContactInfo } from "../../../src/lib/contact-detect";
import { supabase } from "../../../src/lib/supabase";
import type { Message } from "../../../src/lib/types";

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
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
  onClose,
  onSubmit,
  loading,
}: {
  visible: boolean;
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
            This will block them and end the conversation. Your recent messages
            will be saved as a snapshot for review.
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
              {loading ? "Reporting..." : "Report & leave"}
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

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [contactWarningText, setContactWarningText] = useState<string | null>(
    null
  );
  const inputRef = useRef<TextInput>(null);

  const isEnded = info?.matchEnded || info?.conversationDeleted;

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
    } catch {
      Alert.alert("Couldn't send", "Check your connection and try again.");
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
    } catch {
      Alert.alert("Couldn't send", "Check your connection and try again.");
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
        await supabase.rpc("report_message", {
          conv: id,
          target_user: info.partnerId,
          target_msg: recentMessages.length > 0
            ? recentMessages[recentMessages.length - 1].id
            : null,
          report_reason: reason || null,
          content: snapshot,
          also_leave: true,
        });
        setShowReport(false);
        router.replace("/(app)/");
      } catch {
        Alert.alert("Something went wrong", "Please try again.");
      } finally {
        setReporting(false);
      }
    },
    [id, info, user, messages, router]
  );

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
            <TouchableOpacity
              onPress={() => {
                Alert.alert(info.partnerName, undefined, [
                  ...(isEnded
                    ? []
                    : [
                        {
                          text: "Leave conversation",
                          onPress: handleLeave,
                        } as const,
                        {
                          text: "Report",
                          style: "destructive" as const,
                          onPress: () => setShowReport(true),
                        },
                      ]),
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
              Looks like you're sharing contact info. Ndo conversations are
              anonymous for your safety — are you sure?
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
                <Text style={styles.contactWarningSendText}>Send anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isEnded ? (
          <View style={styles.endedBanner}>
            <Text style={styles.endedText}>This conversation has ended.</Text>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#A8A29E"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
              editable={!sending}
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
        onClose={() => setShowReport(false)}
        onSubmit={handleReport}
        loading={reporting}
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
    backgroundColor: "#1C1917",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: "#E7E5E4",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  textOwn: {
    color: "#FAFAF9",
  },
  textTheirs: {
    color: "#1C1917",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  tsOwn: {
    color: "#A8A29E",
    textAlign: "right",
  },
  tsTheirs: {
    color: "#78716C",
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
    backgroundColor: "#1C1917",
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
