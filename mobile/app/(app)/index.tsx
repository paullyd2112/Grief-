import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Modal,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/hooks/useAuth";
import { useProfile } from "../../src/hooks/useProfile";
import { SUPPORT_EMAIL } from "../../src/lib/config";
import type { MatchEndNotice, Warning } from "../../src/lib/types";

interface ConversationItem {
  id: string;
  partnerName: string;
  lastMessage: string | null;
  sortAt: string;
  unread: boolean;
  ended: boolean;
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
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
        .select("body, kind, sender_id, created_at")
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
        partnerName: partner?.display_name ?? "Someone",
        lastMessage: lastMsg
          ? lastMsg.kind === "voice"
            ? "Voice memo"
            : lastMsg.body
          : null,
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1C1917" />
      </View>
    );
  }

  const isNewUser = !guidelinesAccepted || !hasIntake;
  const activeCount = conversations.filter((c) => !c.ended).length;
  const warning = warnings[0];

  const header = (
    <>
      {/* Check-in from Ndo. Never says why it was sent. */}
      {checkInIds.length > 0 && (
        <View style={styles.checkInCard}>
          <Text style={styles.checkInTitle}>Checking in on you</Text>
          <Text style={styles.checkInBody}>
            {"Grief can get really heavy. If things feel like too much right now, you don't have to carry it alone."}
          </Text>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => Linking.openURL("tel:988")}
          >
            <Text style={styles.checkInButtonText}>Call or text 988</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => Linking.openURL("sms:741741&body=HELLO")}
          >
            <Text style={styles.checkInButtonText}>Text HELLO to 741741</Text>
          </TouchableOpacity>
          <Text style={styles.checkInFootnote}>
            Both are free, confidential, and there any time, day or night.
          </Text>
          <TouchableOpacity onPress={dismissCheckIns}>
            <Text style={styles.checkInDismiss}>{"I'm okay for now"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Departure notices */}
      {notices.map((notice) => (
        <View key={notice.id} style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            {notice.leaver_name} left the conversation.
          </Text>
          <Text style={styles.noticeSubtext}>
            People step back for their own reasons — it isn't about you.
          </Text>
          <View style={styles.noticeActions}>
            <TouchableOpacity
              style={styles.noticeButton}
              onPress={() => dismissNotice(notice.id)}
            >
              <Text style={styles.noticeButtonText}>Get matched with someone new</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* New user onboarding */}
      {isNewUser && (
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
          </Text>
          <Text style={styles.welcomeBody}>
            A couple of quick steps and we'll start looking for your match.
          </Text>

          {/* Step 1: Guidelines */}
          <TouchableOpacity
            style={[styles.stepCard, guidelinesAccepted && styles.stepCardDone]}
            onPress={() => router.push("/(app)/guidelines")}
            disabled={guidelinesAccepted}
          >
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, guidelinesAccepted && styles.stepBadgeDone]}>
                <Text style={styles.stepBadgeText}>
                  {guidelinesAccepted ? "✓" : "1"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, guidelinesAccepted && styles.stepTitleDone]}>
                  Read the community guidelines
                </Text>
                <Text style={styles.stepDesc}>
                  {guidelinesAccepted
                    ? "Done"
                    : "The ground rules for every conversation"}
                </Text>
              </View>
              {!guidelinesAccepted && <Text style={styles.stepArrow}>›</Text>}
            </View>
          </TouchableOpacity>

          {/* Step 2: Intake */}
          <TouchableOpacity
            style={[
              styles.stepCard,
              !guidelinesAccepted && styles.stepCardLocked,
              hasIntake && styles.stepCardDone,
            ]}
            onPress={() => router.push("/(app)/intake")}
            disabled={!guidelinesAccepted || !!hasIntake}
          >
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepBadge,
                  hasIntake && styles.stepBadgeDone,
                  !guidelinesAccepted && styles.stepBadgeLocked,
                ]}
              >
                <Text style={styles.stepBadgeText}>{hasIntake ? "✓" : "2"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.stepTitle,
                    !guidelinesAccepted && styles.stepTitleLocked,
                    hasIntake && styles.stepTitleDone,
                  ]}
                >
                  Tell us about your loss
                </Text>
                <Text style={styles.stepDesc}>
                  {hasIntake
                    ? "Done"
                    : "So we can match you with someone who understands"}
                </Text>
              </View>
              {guidelinesAccepted && !hasIntake && (
                <Text style={styles.stepArrow}>›</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Waiting state, only after both steps are done */}
      {!isNewUser && activeCount === 0 && notices.length === 0 && (
        <View style={styles.waitingCard}>
          <Text style={styles.waitingTitle}>
            {"We'll have matches for you shortly"}
          </Text>
          <Text style={styles.waitingBody}>
            {"A real person reads your intake and pairs you with people whose experience fits yours. We'll bring them here as soon as they're ready."}
          </Text>
          <Text style={styles.waitingHint}>Pull down to check for updates.</Text>
        </View>
      )}
    </>
  );

  const footer = (
    <View style={styles.footer}>
      <TouchableOpacity onPress={() => router.push("/(app)/settings")}>
        <Text style={styles.footerLink}>Settings</Text>
      </TouchableOpacity>
      <Text style={styles.footerDivider}>·</Text>
      <TouchableOpacity onPress={() => router.push("/(app)/crisis")}>
        <Text style={styles.footerLink}>Crisis help</Text>
      </TouchableOpacity>
      <Text style={styles.footerDivider}>·</Text>
      <TouchableOpacity onPress={() => router.push("/(app)/feedback")}>
        <Text style={styles.footerLink}>Feedback</Text>
      </TouchableOpacity>
      <Text style={styles.footerDivider}>·</Text>
      <TouchableOpacity onPress={signOut}>
        <Text style={styles.footerLink}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={conversations}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.convRow}
          onPress={() => router.push(`/(app)/conversations/${item.id}`)}
        >
          <View style={[styles.unreadDot, !item.unread && styles.unreadDotHidden]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.convName, item.unread && styles.convNameUnread]}>
              {item.partnerName}
            </Text>
            <Text
              style={[styles.convPreview, item.unread && styles.convPreviewUnread]}
              numberOfLines={1}
            >
              {item.ended
                ? "Conversation ended"
                : item.lastMessage ?? "New match. Say hello when you're ready."}
            </Text>
          </View>
          <Text style={styles.convArrow}>›</Text>
        </TouchableOpacity>
      )}
    />

    {/* Warning from Ndo. Never says who reported or which conversation. */}
    <Modal visible={!!warning} animationType="fade" transparent>
      <View style={styles.warningOverlay}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>A note from the Ndo team</Text>
          <Text style={styles.warningBody}>
            {"After a review, we're reaching out about something that goes against the Code of Conduct."}
          </Text>
          <Text style={styles.warningGuidance}>{warning?.guidance}</Text>
          <Text style={styles.warningBody}>
            {"This is a warning, not a suspension. If it happens again, we may suspend your account."}
          </Text>
          {SUPPORT_EMAIL && (
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              <Text style={styles.warningLink}>
                {`If you think this was a mistake, email ${SUPPORT_EMAIL}.`}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.warningButton}
            onPress={() => warning && acknowledgeWarning(warning.id)}
          >
            <Text style={styles.warningButtonText}>I understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  warningOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  warningCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 12,
  },
  warningBody: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
    marginBottom: 12,
  },
  warningGuidance: {
    fontSize: 15,
    color: "#1C1917",
    lineHeight: 22,
    backgroundColor: "#F5F5F4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  warningLink: {
    fontSize: 14,
    color: "#3B82F6",
    lineHeight: 20,
    marginBottom: 12,
  },
  warningButton: {
    backgroundColor: "#1C1917",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  warningButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAF9",
  },
  welcomeSection: {
    marginTop: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 4,
  },
  welcomeBody: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
    marginBottom: 20,
  },
  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  stepCardDone: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  stepCardLocked: {
    opacity: 0.5,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1C1917",
    justifyContent: "center",
    alignItems: "center",
  },
  stepBadgeDone: {
    backgroundColor: "#22C55E",
  },
  stepBadgeLocked: {
    backgroundColor: "#D6D3D1",
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1917",
  },
  stepTitleDone: {
    color: "#15803D",
  },
  stepTitleLocked: {
    color: "#A8A29E",
  },
  stepDesc: {
    fontSize: 13,
    color: "#78716C",
    marginTop: 2,
  },
  stepArrow: {
    fontSize: 22,
    color: "#A8A29E",
  },
  checkInCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  checkInTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 6,
  },
  checkInBody: {
    fontSize: 15,
    color: "#1E40AF",
    lineHeight: 22,
    marginBottom: 14,
  },
  checkInButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  checkInButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  checkInFootnote: {
    fontSize: 13,
    color: "#1E40AF",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 10,
  },
  checkInDismiss: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 4,
  },
  noticeCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  noticeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
  },
  noticeSubtext: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
    marginBottom: 12,
  },
  noticeActions: {
    flexDirection: "row",
  },
  noticeButton: {
    backgroundColor: "#92400E",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  noticeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  waitingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 8,
  },
  waitingBody: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
  },
  waitingHint: {
    fontSize: 13,
    color: "#A8A29E",
    marginTop: 12,
  },
  convRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    paddingLeft: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
  },
  unreadDotHidden: {
    backgroundColor: "transparent",
  },
  convName: {
    fontSize: 17,
    fontWeight: "500",
    color: "#1C1917",
  },
  convNameUnread: {
    fontWeight: "700",
  },
  convPreview: {
    fontSize: 14,
    color: "#78716C",
    marginTop: 2,
  },
  convPreviewUnread: {
    color: "#1C1917",
  },
  convArrow: {
    fontSize: 22,
    color: "#A8A29E",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
    marginTop: "auto",
  },
  footerLink: {
    fontSize: 15,
    color: "#78716C",
  },
  footerDivider: {
    fontSize: 15,
    color: "#D6D3D1",
  },
});
