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
import type { Conversation, MatchEndNotice } from "../../src/lib/types";

interface ConversationItem {
  id: string;
  matchId: string;
  partnerName: string;
  lastMessageAt: string | null;
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [notices, setNotices] = useState<MatchEndNotice[]>([]);
  const [hasIntake, setHasIntake] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Check if intake is done
      const { data: intake } = await supabase
        .from("intake_responses")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      setHasIntake(!!intake);

      // Fetch active conversations
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
          items.push({
            id: conv.id,
            matchId: match.id,
            partnerName: partner?.display_name ?? "Someone",
            lastMessageAt: null,
          });
        }
        setConversations(items);
      }

      // Unseen departure notices
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

  return (
    <View style={styles.container}>
      {/* Departure notices — D11 wording */}
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

      {/* Intake prompt */}
      {hasIntake === false && (
        <TouchableOpacity
          style={styles.intakeCard}
          onPress={() => router.push("/(app)/intake")}
        >
          <Text style={styles.intakeTitle}>Tell us about your loss</Text>
          <Text style={styles.intakeSubtitle}>
            So we can match you with someone who understands.
          </Text>
        </TouchableOpacity>
      )}

      {/* Waiting state */}
      {hasIntake === true && conversations.length === 0 && (
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
              <Text style={styles.convName}>{item.partnerName}</Text>
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
  intakeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  intakeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 4,
  },
  intakeSubtitle: {
    fontSize: 15,
    color: "#57534E",
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
