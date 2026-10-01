// Building blocks for the conversation screen. Presentational only: the
// screen owns the data.
//
// Messages are grouped like a conversation, not stacked like cards:
// - A run of messages from one person within a few minutes sits close
//   together, and only the last bubble of the run has a tail.
// - Times move out of the bubbles into a quiet label wherever the day
//   changes or there's a long pause. Tap a bubble to see its exact time.

import { Pressable, StyleSheet, View } from "react-native";
import { radius, space, type as typeScale, useTheme } from "../../theme";
import { Text } from "../ui";
import type { Message } from "../../lib/types";

// Messages closer together than this, from the same person, are one run.
const GROUP_GAP_MS = 5 * 60_000;
// A pause longer than this gets its own time label, even on the same day.
const SEPARATOR_GAP_MS = 60 * 60_000;

export type ChatItem =
  | {
      type: "message";
      key: string;
      message: Message;
      // In reading order: the first and last bubble of a run.
      groupStart: boolean;
      groupEnd: boolean;
    }
  | { type: "separator"; key: string; label: string };

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// "Today 9:41 AM", "Yesterday 8:02 PM", "Sunday 2:04 AM", "Mar 3, 4:10 PM".
export function formatSeparator(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return `Today ${time}`;
  if (days === 1) return `Yesterday ${time}`;
  if (days < 7) return `${date.toLocaleDateString([], { weekday: "long" })} ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

// `messages` arrive newest first (the list is inverted). Returns items in the
// same order, with separators placed so they render above their block.
export function buildChatItems(messages: Message[], now: Date = new Date()): ChatItem[] {
  const chronological = [...messages].reverse();
  const items: ChatItem[] = [];

  chronological.forEach((message, i) => {
    const prev = chronological[i - 1];
    const next = chronological[i + 1];
    const at = new Date(message.created_at);

    const needsSeparator =
      !prev ||
      !sameDay(new Date(prev.created_at), at) ||
      at.getTime() - new Date(prev.created_at).getTime() > SEPARATOR_GAP_MS;
    if (needsSeparator) {
      items.push({
        type: "separator",
        key: `sep-${message.id}`,
        label: formatSeparator(message.created_at, now),
      });
    }

    const joinsPrev =
      !!prev &&
      !needsSeparator &&
      prev.sender_id === message.sender_id &&
      at.getTime() - new Date(prev.created_at).getTime() <= GROUP_GAP_MS;
    const nextJoins =
      !!next &&
      next.sender_id === message.sender_id &&
      sameDay(new Date(next.created_at), at) &&
      new Date(next.created_at).getTime() - at.getTime() <= GROUP_GAP_MS;

    items.push({
      type: "message",
      key: message.id,
      message,
      groupStart: !joinsPrev,
      groupEnd: !nextJoins,
    });
  });

  return items.reverse();
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <Text variant="caption" color="textTertiary" align="center" style={styles.separator}>
      {label}
    </Text>
  );
}

// Space above a bubble: a little within a run, more where a new run starts.
export function groupSpacing(groupStart: boolean) {
  return { marginTop: groupStart ? space.md : 2 };
}

export function TextBubble({
  message,
  isOwn,
  groupEnd,
  showTime,
  onPress,
  onLongPress,
}: {
  message: Message;
  isOwn: boolean;
  groupEnd: boolean;
  showTime: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const { color } = useTheme();
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={[styles.wrap, isOwn ? styles.own : styles.theirs]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        accessibilityHint="Tap to show the time"
        style={[
          styles.bubble,
          {
            backgroundColor: isOwn ? color.bubbleOwn : color.bubbleTheirs,
          },
          groupEnd && (isOwn ? styles.tailOwn : styles.tailTheirs),
        ]}
      >
        <Text
          style={[
            typeScale.body,
            { color: isOwn ? color.bubbleOwnText : color.bubbleTheirsText },
          ]}
        >
          {message.body}
        </Text>
      </Pressable>
      {showTime && (
        <Text variant="caption" color="textTertiary" style={styles.time}>
          {time}
        </Text>
      )}
    </View>
  );
}

export function UnsentLine({ text, isOwn }: { text: string; isOwn: boolean }) {
  return (
    <View style={[styles.wrap, isOwn ? styles.own : styles.theirs]}>
      <Text variant="footnote" color="textTertiary" style={styles.unsent}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  separator: {
    marginTop: space.xl,
    marginBottom: space.xs,
  },
  wrap: {
    maxWidth: "80%",
  },
  own: { alignSelf: "flex-end", alignItems: "flex-end" },
  theirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    borderRadius: radius.bubble,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
  },
  tailOwn: { borderBottomRightRadius: 6 },
  tailTheirs: { borderBottomLeftRadius: 6 },
  time: {
    marginTop: space.xs,
    paddingHorizontal: space.xs,
  },
  unsent: {
    fontStyle: "italic",
    paddingHorizontal: space.xs,
  },
});
