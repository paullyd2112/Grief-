import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { setActiveConversation } from "../../../src/lib/notifications";
import { useAuth } from "../../../src/hooks/useAuth";
import { useMessages } from "../../../src/hooks/useMessages";
import { useConversation } from "../../../src/hooks/useConversation";
import { useVoiceMemo } from "../../../src/hooks/useVoiceMemo";
import { containsContactInfo } from "../../../src/lib/contact-detect";
import { sendErrorMessage } from "../../../src/lib/send-errors";
import { VoiceBubble } from "../../../src/components/VoiceBubble";
import { MediaBubble } from "../../../src/components/MediaBubble";
import { MediaComposer } from "../../../src/components/MediaComposer";
import {
  ATTACHMENTS_BUCKET,
  MAX_ITEMS_PER_MESSAGE,
  MediaError,
  copyForReport,
  getExplainerSeen,
  getShowRightAway,
  markExplainerSeen,
  pickMedia,
  sendMedia,
  unsendMessage,
  type PickedMedia,
} from "../../../src/lib/media";
import { WorriedSheet } from "../../../src/components/WorriedSheet";
import { supabase } from "../../../src/lib/supabase";
import type { Message } from "../../../src/lib/types";
import {
  DaySeparator,
  TextBubble,
  UnsentLine,
  buildChatItems,
  groupSpacing,
} from "../../../src/components/chat/ChatParts";
import { Avatar, BottomSheet, Button, Icon, NoticeBanner, Text } from "../../../src/components/ui";
import { minTapTarget, radius, space, type as typeScale, useTheme } from "../../../src/theme";

function formatRecordingTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function MessageBubble({
  message,
  isOwn,
  partnerName,
  groupEnd,
  showTime,
  showRightAway,
  showExplainer,
  onRevealed,
  onPress,
  onLongPress,
}: {
  message: Message;
  isOwn: boolean;
  partnerName: string;
  groupEnd: boolean;
  showTime: boolean;
  showRightAway: boolean;
  showExplainer: boolean;
  onRevealed: () => void;
  onPress: () => void;
  onLongPress: () => void;
}) {
  if (message.kind === "media") {
    return (
      <MediaBubble
        message={message}
        isOwn={isOwn}
        partnerName={partnerName}
        showRightAway={showRightAway}
        showExplainer={showExplainer}
        onRevealed={onRevealed}
        onLongPress={onLongPress}
      />
    );
  }

  if (message.kind === "voice" && message.unsent_at) {
    return (
      <UnsentLine
        isOwn={isOwn}
        text={isOwn ? "You unsent a voice memo" : `${partnerName} unsent a voice memo`}
      />
    );
  }

  if (message.kind === "voice" && message.voice_memo_id) {
    return (
      <VoiceBubble
        voiceMemoId={message.voice_memo_id}
        isOwn={isOwn}
        groupEnd={groupEnd}
        onLongPress={onLongPress}
      />
    );
  }

  return (
    <TextBubble
      message={message}
      isOwn={isOwn}
      groupEnd={groupEnd}
      showTime={showTime}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  );
}

function ReportSheet({
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
  const { color } = useTheme();
  const [reason, setReason] = useState("");

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Report this person">
      <View style={styles.sheetBody}>
        <Text variant="callout" color="textSecondary">
          {ended
            ? "This will block them. Your recent messages, including photos and videos, will be saved as a snapshot for review. You can also report something that happened outside the app."
            : "This will block them and end the conversation. Your recent messages, including photos and videos, will be saved as a snapshot for review."}
        </Text>
        <TextInput
          style={[
            typeScale.body,
            styles.reportInput,
            { backgroundColor: color.surfaceSunken, color: color.text },
          ]}
          placeholder="What happened? (optional)"
          placeholderTextColor={color.textTertiary}
          value={reason}
          onChangeText={setReason}
          multiline
        />
        <Button
          title={ended ? "Report" : "Report and leave"}
          variant="destructive"
          block
          loading={loading}
          onPress={() => onSubmit(reason)}
        />
        <Button title="Cancel" variant="quiet" block onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

function IconButton({
  name,
  label,
  onPress,
  disabled,
}: {
  name: "plus" | "mic";
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        (pressed || disabled) && { opacity: 0.4 },
      ]}
    >
      <Icon name={name} size={22} color={color.textSecondary} />
    </Pressable>
  );
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { info, loading: convLoading } = useConversation(id, user?.id);
  const { messages, loading: msgsLoading, sendMessage, markUnsent } = useMessages(id);
  const voice = useVoiceMemo(id);
  const { color } = useTheme();
  // The one message whose exact time is showing (tap a bubble to toggle).
  const [timeFor, setTimeFor] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showWorried, setShowWorried] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [contactWarningText, setContactWarningText] = useState<string | null>(
    null
  );
  const inputRef = useRef<TextInput>(null);

  // Photos and videos
  const [picked, setPicked] = useState<PickedMedia[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [batch, setBatch] = useState(0);
  const [mediaSending, setMediaSending] = useState(false);
  const [mediaProgress, setMediaProgress] = useState<{ done: number; total: number } | null>(null);
  const [showRightAway, setShowRightAway] = useState(false);
  const [explainerSeen, setExplainerSeen] = useState(true);

  useEffect(() => {
    getShowRightAway().then(setShowRightAway);
    getExplainerSeen().then(setExplainerSeen);
  }, []);

  // Photos and videos unlock once both people have said something. The
  // database enforces it; this just explains it before the picker opens.
  const mediaUnlocked =
    !!user &&
    messages.some((m) => m.sender_id === user.id) &&
    messages.some((m) => m.sender_id !== user.id);

  const isEnded = info?.matchEnded || info?.conversationDeleted;

  // No notification banner for messages in the conversation you're looking at.
  useFocusEffect(
    useCallback(() => {
      setActiveConversation(id ?? null);
      return () => setActiveConversation(null);
    }, [id])
  );

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

  const handleAttach = useCallback(async () => {
    if (!mediaUnlocked) {
      Alert.alert(
        "Not yet",
        "Photos and videos unlock once you've both said hello. Send a message first, and once they reply you can share photos."
      );
      return;
    }
    const items = await pickMedia(MAX_ITEMS_PER_MESSAGE);
    if (!items || items.length === 0) return;
    setPicked(items);
    setBatch((b) => b + 1);
    setComposerOpen(true);
  }, [mediaUnlocked]);

  const handleSendMedia = useCallback(
    async (caption: string, allowSave: boolean) => {
      if (!id || !user || mediaSending) return;
      setMediaSending(true);
      setMediaProgress({ done: 0, total: picked.length });
      try {
        await sendMedia({
          conversationId: id,
          senderId: user.id,
          items: picked,
          caption,
          allowSave,
          onProgress: (done, total) => setMediaProgress({ done, total }),
        });
        setComposerOpen(false);
        setPicked([]);
      } catch (e) {
        Alert.alert(
          "Couldn't send",
          e instanceof MediaError ? e.message : sendErrorMessage(e)
        );
      } finally {
        setMediaSending(false);
        setMediaProgress(null);
      }
    },
    [id, user, picked, mediaSending]
  );

  // Long-press: unsend your own photos, videos and voice memos; report theirs.
  const handleMessageLongPress = useCallback(
    (message: Message) => {
      if (!user || message.unsent_at) return;
      if (message.sender_id === user.id) {
        if (message.kind === "text") return;
        const what = message.kind === "voice" ? "voice memo" : "photo or video";
        Alert.alert(`Unsend this ${what}?`, "It will be removed for both of you.", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unsend",
            style: "destructive",
            onPress: async () => {
              try {
                await unsendMessage(message.id);
                markUnsent(message.id);
              } catch (e) {
                Alert.alert("Couldn't unsend", sendErrorMessage(e));
              }
            },
          },
        ]);
        return;
      }
      Alert.alert("Report this?", "A person at Ndo will review it. You won't have to open it.", [
        { text: "Cancel", style: "cancel" },
        { text: "Report", style: "destructive", onPress: () => setShowReport(true) },
      ]);
    },
    [user, markUnsent]
  );

  const handleExplainerSeen = useCallback(() => {
    if (explainerSeen) return;
    setExplainerSeen(true);
    markExplainerSeen();
  }, [explainerSeen]);

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
            router.replace("/(app)/(tabs)");
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

      try {
        // Photos and videos are copied to a folder only operators can read,
        // so a report shows what was sent even if it's later unsent.
        const media = await copyForReport(
          user.id,
          recentMessages.filter((m) => m.kind === "media" && !m.unsent_at).map((m) => m.id)
        );
        const snapshot = {
          messages: recentMessages.map((m) => ({
            id: m.id,
            sender_id: m.sender_id,
            kind: m.kind,
            body: m.body,
            created_at: m.created_at,
            unsent_at: m.unsent_at,
            attachments: media.get(m.id) ?? undefined,
          })),
          reported_at: new Date().toISOString(),
        };

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
          [{ text: "OK", onPress: () => router.replace("/(app)/(tabs)") }]
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
            router.replace("/(app)/(tabs)");
          },
        },
      ]
    );
  }, [id, info, isEnded, router]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      "Delete conversation?",
      "This permanently removes all messages, photos, videos and voice memos for both of you. This can't be undone.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Delete for both",
          style: "destructive",
          onPress: async () => {
            // Audio must go first: once the conversation is deleted, storage
            // rules stop letting either participant see the files.
            for (const name of ["voice-memos", ATTACHMENTS_BUCKET]) {
              const bucket = supabase.storage.from(name);
              const { data: files } = await bucket.list(id, { limit: 1000 });
              if (files?.length) {
                await bucket.remove(files.map((f) => `${id}/${f.name}`));
              }
            }
            await supabase.rpc("delete_conversation", { conv: id });
            router.replace("/(app)/(tabs)");
          },
        },
      ]
    );
  }, [id, router]);

  if (convLoading || msgsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: color.background }]}>
        <ActivityIndicator color={color.textSecondary} />
      </View>
    );
  }

  if (!info) {
    return (
      <View style={[styles.center, { backgroundColor: color.background }]}>
        <Text variant="callout" color="textSecondary">
          Conversation not found
        </Text>
      </View>
    );
  }

  const items = buildChatItems(messages);
  const busy = sending || voice.uploading || mediaSending;

  // "I'm worried about them" first, as the brief asks. Native sheet on iOS.
  const openMenu = () => {
    const actions: { label: string; destructive?: boolean; run: () => void }[] = [
      { label: "I'm worried about them", run: () => setShowWorried(true) },
      ...(isEnded ? [] : [{ label: "Leave conversation", run: handleLeave }]),
      { label: "Block", destructive: true, run: handleBlock },
      { label: "Report", destructive: true, run: () => setShowReport(true) },
      { label: "Delete conversation", destructive: true, run: handleDelete },
    ];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: info.partnerName,
          options: [...actions.map((a) => a.label), "Cancel"],
          destructiveButtonIndex: actions
            .map((a, i) => (a.destructive ? i : -1))
            .filter((i) => i >= 0),
          cancelButtonIndex: actions.length,
        },
        (index) => actions[index]?.run()
      );
      return;
    }
    Alert.alert(info.partnerName, undefined, [
      ...actions.map((a) => ({
        text: a.label,
        style: a.destructive ? ("destructive" as const) : ("default" as const),
        onPress: a.run,
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: color.background },
          headerShadowVisible: false,
          headerTintColor: color.text,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Avatar seed={info.partnerId} name={info.partnerName} size={28} />
              <Text variant="headline" numberOfLines={1}>
                {info.partnerName}
              </Text>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push("/(app)/crisis")}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text variant="subhead" color="textSecondary">
                  Get help
                </Text>
              </Pressable>
              <Pressable
                onPress={openMenu}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="More options"
              >
                <Icon name="more" size={22} color={color.text} />
              </Pressable>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: color.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          inverted
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) =>
            item.type === "separator" ? (
              <DaySeparator label={item.label} />
            ) : (
              <View style={groupSpacing(item.groupStart)}>
                <MessageBubble
                  message={item.message}
                  isOwn={item.message.sender_id === user?.id}
                  partnerName={info.partnerName}
                  groupEnd={item.groupEnd}
                  showTime={timeFor === item.message.id}
                  showRightAway={showRightAway}
                  showExplainer={!explainerSeen}
                  onRevealed={handleExplainerSeen}
                  onPress={() =>
                    setTimeFor((current) => (current === item.message.id ? null : item.message.id))
                  }
                  onLongPress={() => handleMessageLongPress(item.message)}
                />
              </View>
            )
          }
          ListEmptyComponent={
            // Inverted lists flip their empty state too; flip it back.
            <View style={styles.empty}>
              <Text variant="callout" color="textSecondary" align="center">
                {"Say hello. They're going through something too."}
              </Text>
            </View>
          }
        />

        {contactWarningText && (
          <NoticeBanner
            style={styles.banner}
            body="Just checking you mean to share this. It looks like contact info, and once it's sent they'll have it. Only share what you're comfortable with."
          >
            <View style={styles.bannerActions}>
              <Button title="Edit" variant="quiet" onPress={() => setContactWarningText(null)} />
              <Button title="Send" onPress={confirmSendWithContact} />
            </View>
          </NoticeBanner>
        )}

        {isEnded ? (
          <View style={[styles.ended, { borderTopColor: color.hairline }]}>
            <Text variant="footnote" color="textTertiary" align="center">
              This conversation has ended.
            </Text>
          </View>
        ) : voice.recording ? (
          <View style={[styles.composer, { borderTopColor: color.hairline }]}>
            <View style={styles.recording}>
              <View style={[styles.recordingDot, { backgroundColor: color.danger }]} />
              <Text variant="bodyMedium" style={styles.recordingTime}>
                {formatRecordingTime(voice.durationMs)}
              </Text>
              <Text variant="footnote" color="textTertiary">
                up to 5:00
              </Text>
            </View>
            <Button title="Cancel" variant="quiet" onPress={voice.cancelRecording} />
            <Button
              title="Send"
              loading={voice.uploading}
              onPress={async () => {
                await voice.stopRecording();
                if (user) await voice.sendVoiceMemo(user.id);
              }}
            />
          </View>
        ) : (
          <View style={[styles.composer, { borderTopColor: color.hairline }]}>
            <IconButton
              name="plus"
              label="Send a photo or video"
              onPress={handleAttach}
              disabled={busy}
            />
            <TextInput
              ref={inputRef}
              style={[
                typeScale.body,
                styles.input,
                { backgroundColor: color.surfaceSunken, color: color.text },
              ]}
              placeholder="Message"
              placeholderTextColor={color.textTertiary}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
              editable={!sending && !voice.uploading}
            />
            {text.trim() ? (
              <Pressable
                onPress={handleSend}
                disabled={sending}
                accessibilityRole="button"
                accessibilityLabel="Send"
                style={({ pressed }) => [
                  styles.send,
                  { backgroundColor: pressed ? color.accentFillPressed : color.accentFill },
                  sending && { opacity: 0.5 },
                ]}
              >
                <Icon name="send" size={18} color={color.onAccent} />
              </Pressable>
            ) : (
              <IconButton
                name="mic"
                label="Record a voice memo"
                onPress={voice.startRecording}
                disabled={busy}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      <ReportSheet
        visible={showReport}
        ended={!!isEnded}
        onClose={() => setShowReport(false)}
        onSubmit={handleReport}
        loading={reporting}
      />

      <MediaComposer
        key={batch}
        visible={composerOpen}
        items={picked}
        partnerName={info.partnerName}
        sending={mediaSending}
        progress={mediaProgress}
        onRemove={(index) => {
          const next = picked.filter((_, i) => i !== index);
          setPicked(next);
          if (next.length === 0) setComposerOpen(false);
        }}
        onCancel={() => {
          setComposerOpen(false);
          setPicked([]);
        }}
        onSend={handleSendMedia}
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: space.sm, maxWidth: 220 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: space.lg },
  messageList: { paddingHorizontal: space.lg, paddingVertical: space.md, flexGrow: 1 },
  empty: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: space.xxl,
    transform: [{ scaleY: -1 }],
  },
  banner: { marginHorizontal: space.lg, marginBottom: space.sm },
  bannerActions: { flexDirection: "row", justifyContent: "flex-end", gap: space.sm, marginTop: space.sm },
  ended: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: space.lg },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: minTapTarget - 4,
    height: minTapTarget - 4,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    borderRadius: radius.bubble,
    paddingHorizontal: space.lg,
    paddingTop: 9,
    paddingBottom: 9,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  recording: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm },
  recordingDot: { width: 10, height: 10, borderRadius: 5 },
  recordingTime: { fontVariant: ["tabular-nums"] },
  sheetBody: { gap: space.lg },
  reportInput: {
    minHeight: 88,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    textAlignVertical: "top",
  },
});
