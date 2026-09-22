import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface ConversationInfo {
  conversationId: string;
  matchId: string;
  partnerId: string;
  partnerName: string;
  matchEnded: boolean;
  conversationDeleted: boolean;
}

export function useConversation(
  conversationId: string | undefined,
  userId: string | undefined
) {
  const [info, setInfo] = useState<ConversationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const load = async () => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id, match_id, deleted_at")
        .eq("id", conversationId)
        .single();

      if (!conv) {
        setLoading(false);
        return;
      }

      const { data: match } = await supabase
        .from("matches")
        .select("id, user_a, user_b, ended_at")
        .eq("id", conv.match_id)
        .single();

      if (!match) {
        setLoading(false);
        return;
      }

      const partnerId =
        match.user_a === userId ? match.user_b : match.user_a;

      const { data: partner } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", partnerId)
        .single();

      setInfo({
        conversationId: conv.id,
        matchId: match.id,
        partnerId,
        partnerName: partner?.display_name ?? "Someone",
        matchEnded: !!match.ended_at,
        conversationDeleted: !!conv.deleted_at,
      });
      setLoading(false);
    };

    load();
  }, [conversationId, userId]);

  return { info, loading };
}
