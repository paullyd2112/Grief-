import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { Message } from "../lib/types";

export function useMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(100);

      setMessages(data ?? []);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (body: string, senderId: string) => {
      if (!conversationId) return;

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: senderId,
        kind: "text",
        body: body.trim(),
      });

      if (error) throw error;
    },
    [conversationId]
  );

  return { messages, loading, sendMessage };
}
