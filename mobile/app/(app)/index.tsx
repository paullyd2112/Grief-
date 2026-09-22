import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/hooks/useAuth";
import { useProfile } from "../../src/hooks/useProfile";
import type { MatchEndNotice } from "../../src/lib/types";

interface ConversationItem {
  id: string;
  matchId: string;
  partnerName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile(user?.id);
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [notices, setNotices] = useState<MatchEndNotice[]>([]);
  const [hasIntake, setHasIntake] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const guidelinesAccepted = !!profile?.guidelines_accepted_at;

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
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
          conversations!inner (
            id, match_id, deleted_at,
            matches!inner ( id, ended_at, user_a, user_b )
          )
        `)
        .eq("user_id", user.id)
        .is("conversations.deleted_at", null)
        .is("conversations.matches.ended_at", null);

      if (convs) {
        const items: ConversationItem[] = [];
        for (const row of convs as any[]) {
          const conv = row.conversations;
          const match = conv.matches;
          const partnerId =
            match.user_a === user.id ? match.user_b : match.user_a;
          const { data: partner } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", partnerId)
            .single();
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("body, kind, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          items.push({
            id: conv.id,
            matchId: match.id,
            partnerName: partner?.display_name ?? "Someone",
            lastMessage: lastMsg
              ? lastMsg.kind === "voice"
                ? "Voice memo"
                : lastMsg.body
              : null,
            lastMessageAt: lastMsg?.created_at ?? null,
          });
        }
        setConversations(items);
      }

      const { data: unseenNotices } = await supabase
        .from("match_end_notices")
        .select("*")
        .eq("recipient_id", user.id)
        .is("seen_at", null);

      setNotices(unseenNotices ?? []);
      setLoading(false);
    };

    loadData();
  }, [user]);

  const dismissNotice = async (id: string) => {
    await supabase
      .from("match_end_notices")
      .update({ seen_at: new Date().toISOString() })
      .eq("id", id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1C1917" />
      </View>
    );
  }

  const isNewUser = !guidelinesAccepted || !hasIntake;

  return (
    <View style={styles.container}>
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
            style={[
              styles.stepCard,
              guidelinesAccepted && styles.stepCardDone,
            ]}
            onPress={() => {
              if (!guidelinesAccepted) {
                router.push("/(app)/guidelines");
              }
            }}
            disabled={guidelinesAccepted}
          >
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepBadge,
                  guidelinesAccepted && styles.stepBadgeDone,
                ]}
              >
                <Text
                  style={[
                    styles.stepBadgeText,
                    guidelinesAccepted && styles.stepBadgeTextDone,
                  ]}
                >
                  {guidelinesAccepted ? "✓" : "1"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.stepTitle,
                    guidelinesAccepted && styles.stepTitleDone,
                  ]}
                >
                  Read the community guidelines
                </Text>
                <Text style={styles.stepDesc}>
                  {guidelinesAccepted
                    ? "Done"
                    : "The ground rules for every conversation"}
                </Text>
              </View>
              {!guidelinesAccepted && (
                <Text style={styles.stepArrow}>›</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Step 2: Intake */}
          <TouchableOpacity
            style={[
              styles.stepCard,
              !guidelinesAccepted && styles.stepCardLocked,
              hasIntake && styles.stepCardDone,
            ]}
            onPress={() => {
              if (guidelinesAccepted && !hasIntake) {
                router.push("/(app)/intake");
              }
            }}
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
                <Text
                  style={[
                    styles.stepBadgeText,
                    hasIntake && styles.stepBadgeTextDone,
                    !guidelinesAccepted && styles.stepBadgeTextLocked,
                  ]}
                >
                  {hasIntake ? "✓" : "2"}
                </Text>
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

      {/* Waiting state — only after both steps complete */}
      {guidelinesAccepted && hasIntake && conversations.length === 0 && notices.length === 0 && (
        <View style={styles.waitingCard}>
          <Text style={styles.waitingTitle}>We're finding someone for you</Text>
          <Text style={styles.waitingBody}>
            Matches are made by hand — a real person reads your intake and pairs
            you with someone whose experience fits. This takes a little time, and
            it's worth it.
          </Text>
        </View>
      )}

      {/* Conversations */}
      {conversations.length > 0 && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convRow}
              onPress={() =>
                router.push(`/(app)/conversations/${item.id}`)
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.convName}>{item.partnerName}</Text>
                {item.lastMessage && (
                  <Text style={styles.convPreview} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                )}
              </View>
              <Text style={styles.convArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push("/(app)/settings")}>
          <Text style={styles.footerLink}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.footerDivider}>·</Text>
        <TouchableOpacity onPress={() => router.push("/(app)/crisis")}>
          <Text style={styles.footerLink}>Crisis help</Text>
        </TouchableOpacity>
        <Text style={styles.footerDivider}>·</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.footerLink}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAF9",
  },
  welcomeSection: {
    marginTop: 16,
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
  stepBadgeTextDone: {
    color: "#fff",
  },
  stepBadgeTextLocked: {
    color: "#fff",
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
    marginTop: 16,
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
  convRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  convName: {
    fontSize: 17,
    fontWeight: "500",
    color: "#1C1917",
  },
  convPreview: {
    fontSize: 14,
    color: "#78716C",
    marginTop: 2,
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
