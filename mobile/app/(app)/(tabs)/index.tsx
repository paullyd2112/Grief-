import { useCallback, useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, LargeTitleHeader, Text } from "../../../src/components/ui";
import {
  CheckInCard,
  ConversationRow,
  CrisisHelpButton,
  DepartureNotice,
  OnboardingProgress,
  WaitingState,
  formatListTime,
} from "../../../src/components/home/HomeBlocks";
import { gutter, hairlineWidth, radius, space, useTheme } from "../../../src/theme";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/hooks/useAuth";
import { useProfile } from "../../../src/hooks/useProfile";
import { SUPPORT_EMAIL } from "../../../src/lib/config";
import type { AttachmentKind, MatchEndNotice, Warning } from "../../../src/lib/types";
import { describeAttachments } from "../../../src/lib/media";
import { registerForPush } from "../../../src/lib/notifications";

interface ConversationItem {
  id: string;
  partnerId: string;
  partnerName: string;
  // Time of the last message, if there is one.
  lastAt: string | null;
  lastMessage: string | null;
  sortAt: string;
  unread: boolean;
  ended: boolean;
}


// One line for the conversation list. Never shows what a photo is, only that
// one was sent.
function previewFor(msg: {
  kind: string;
  body: string | null;
  unsent_at: string | null;
  attachments: { kind: AttachmentKind }[] | null;
}): string | null {
  if (msg.unsent_at) return "Unsent";
  if (msg.kind === "voice") return "Voice memo";
  if (msg.kind === "media") return describeAttachments((msg.attachments ?? []).map((a) => a.kind)) || "Photo";
  return msg.body;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { color } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, refetch: refetchProfile } = useProfile(user?.id);
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [notices, setNotices] = useState<MatchEndNotice[]>([]);
  const [checkInIds, setCheckInIds] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [hasIntake, setHasIntake] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const guidelinesAccepted = !!profile?.guidelines_accepted_at;

  const loadData = useCallback(async () => {
    if (!user) return;

    const { data: intake } = await supabase
      .from("intake_responses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    setHasIntake(!!intake);
    // After intake is the moment notifications make sense ("we'll let you
    // know when you're matched"), so that's where we ask.
    if (intake) registerForPush({ ask: true });

    const { data: convs } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        last_read_at,
        conversations!inner (
          id, match_id, created_at, deleted_at,
          matches!inner ( id, ended_at, user_a, user_b )
        )
      `)
      .eq("user_id", user.id)
      .is("conversations.deleted_at", null);

    const items: ConversationItem[] = [];
    for (const row of (convs ?? []) as any[]) {
      const conv = row.conversations;
      const match = conv.matches;
      const partnerId = match.user_a === user.id ? match.user_b : match.user_a;
      const { data: partner } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", partnerId)
        .single();
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("body, kind, sender_id, created_at, unsent_at, attachments(kind)")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const ended = !!match.ended_at;
      const unread =
        !ended &&
        !!lastMsg &&
        lastMsg.sender_id !== user.id &&
        (!row.last_read_at ||
          new Date(lastMsg.created_at) > new Date(row.last_read_at));

      items.push({
        id: conv.id,
        partnerId,
        partnerName: partner?.display_name ?? "Someone",
        lastAt: lastMsg?.created_at ?? null,
        lastMessage: lastMsg ? previewFor(lastMsg) : null,
        sortAt: lastMsg?.created_at ?? conv.created_at,
        unread,
        ended,
      });
    }
    // Active conversations first. Ended ones stay listed so they can still be
    // reported or deleted.
    items.sort(
      (a, b) =>
        Number(a.ended) - Number(b.ended) ||
        new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
    );
    setConversations(items);

    const { data: unseenNotices } = await supabase
      .from("match_end_notices")
      .select("*")
      .eq("recipient_id", user.id)
      .is("seen_at", null);

    setNotices(unseenNotices ?? []);

    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("id")
      .is("seen_at", null);

    setCheckInIds((checkIns ?? []).map((c) => c.id));

    const { data: unseenWarnings } = await supabase
      .from("warnings")
      .select("*")
      .is("seen_at", null)
      .order("created_at", { ascending: true });

    setWarnings(unseenWarnings ?? []);
    setLoading(false);
  }, [user]);

  // Reload whenever the screen regains focus, so returning from guidelines,
  // intake, or a conversation shows current state.
  useFocusEffect(
    useCallback(() => {
      loadData();
      refetchProfile();
    }, [loadData, refetchProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refetchProfile()]);
    setRefreshing(false);
  }, [loadData, refetchProfile]);

  const dismissNotice = async (id: string) => {
    await supabase
      .from("match_end_notices")
      .update({ seen_at: new Date().toISOString() })
      .eq("id", id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const dismissCheckIns = async () => {
    const ids = checkInIds;
    setCheckInIds([]);
    await supabase
      .from("check_ins")
      .update({ seen_at: new Date().toISOString() })
      .in("id", ids);
  };

  const acknowledgeWarning = async (id: string) => {
    setWarnings((prev) => prev.filter((w) => w.id !== id));
    await supabase
      .from("warnings")
      .update({ seen_at: new Date().toISOString() })
      .eq("id", id);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: color.background }]}>
        <ActivityIndicator color={color.textSecondary} />
      </View>
    );
  }

  const isNewUser = !guidelinesAccepted || !hasIntake;
  const activeCount = conversations.filter((c) => !c.ended).length;
  const warning = warnings[0];

  const header = (
    <>
      <LargeTitleHeader
        title="Conversations"
        trailing={<CrisisHelpButton onPress={() => router.push("/(app)/crisis")} />}
      />

      {/* Check-in from Ndo. Never says why it was sent. */}
      {checkInIds.length > 0 && <CheckInCard onDismiss={dismissCheckIns} />}

      {notices.map((notice) => (
        <DepartureNotice
          key={notice.id}
          leaverName={notice.leaver_name}
          onDismiss={() => dismissNotice(notice.id)}
        />
      ))}

      {isNewUser && (
        <OnboardingProgress
          displayName={profile?.display_name}
          guidelinesDone={guidelinesAccepted}
          intakeDone={!!hasIntake}
          onGuidelines={() => router.push("/(app)/guidelines")}
          onIntake={() => router.push("/(app)/intake")}
        />
      )}

      {/* Waiting, only after both steps are done */}
      {!isNewUser && activeCount === 0 && notices.length === 0 && <WaitingState />}
    </>
  );

  const footer = (
    <Pressable
      onPress={() => router.push("/(app)/feedback")}
      accessibilityRole="link"
      style={({ pressed }) => [styles.footer, pressed && { opacity: 0.6 }]}
    >
      <Text variant="footnote" color="textTertiary" align="center">
        Something not right? Send feedback
      </Text>
    </Pressable>
  );

  return (
    <>
      <FlatList
        style={{ backgroundColor: color.background }}
        contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: space.xxl }}
        data={conversations}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={color.textTertiary}
          />
        }
        renderItem={({ item }) => (
          <ConversationRow
            partnerId={item.partnerId}
            partnerName={item.partnerName}
            preview={item.lastMessage}
            time={item.lastAt ? formatListTime(item.lastAt) : null}
            unread={item.unread}
            ended={item.ended}
            onPress={() => router.push(`/(app)/conversations/${item.id}`)}
          />
        )}
      />

      {/* Warning from Ndo. Never says who reported or which conversation. */}
      <Modal visible={!!warning} animationType="fade" transparent>
        <View style={[styles.warningOverlay, { backgroundColor: color.scrim }]}>
          <View
            style={[
              styles.warningCard,
              { backgroundColor: color.surface, borderColor: color.hairline },
            ]}
          >
            <Text variant="caption" color="textTertiary" style={styles.eyebrow}>
              FROM NDO
            </Text>
            <Text variant="title2">A note from the Ndo team</Text>
            <Text variant="callout" color="textSecondary">
              {"After a review, we're reaching out about something that goes against the Code of Conduct."}
            </Text>
            <Text variant="callout" style={[styles.guidance, { borderLeftColor: color.accent }]}>
              {warning?.guidance}
            </Text>
            <Text variant="callout" color="textSecondary">
              {"This is a warning, not a suspension. If it happens again, we may suspend your account."}
            </Text>
            {!!SUPPORT_EMAIL && (
              <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
                <Text variant="footnote" color="accent">
                  {`If you think this was a mistake, email ${SUPPORT_EMAIL}.`}
                </Text>
              </Pressable>
            )}
            <Button
              title="I understand"
              block
              onPress={() => warning && acknowledgeWarning(warning.id)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  footer: { paddingHorizontal: gutter, paddingTop: space.xxxl, paddingBottom: space.lg },
  warningOverlay: { flex: 1, justifyContent: "center", padding: space.xxl },
  warningCard: {
    borderRadius: radius.lg,
    borderWidth: hairlineWidth,
    padding: space.xxl,
    gap: space.md,
  },
  eyebrow: { letterSpacing: 1.2 },
  guidance: { borderLeftWidth: 2, paddingLeft: space.md },
});
