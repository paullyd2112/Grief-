import { useState, useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { supabase } from "../lib/supabase";
import { radius, space, type as typeScale, useTheme } from "../theme";
import { Icon, Text } from "./ui";

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// A voice memo: play/pause, progress, length. Playback only, never saved.
export function VoiceBubble({
  voiceMemoId,
  isOwn,
  groupEnd = true,
  onLongPress,
}: {
  voiceMemoId: string;
  isOwn: boolean;
  // Last bubble of a run gets the tail (see chat/ChatParts.tsx).
  groupEnd?: boolean;
  // Unsend (your own) or report (theirs); handled by the conversation screen.
  onLongPress?: () => void;
}) {
  const { color } = useTheme();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [storedDurationMs, setStoredDurationMs] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: memo } = await supabase
        .from("voice_memos")
        .select("storage_path, duration_ms")
        .eq("id", voiceMemoId)
        .single();

      if (!memo) return;
      setStoredDurationMs(memo.duration_ms);

      const { data } = await supabase.storage
        .from("voice-memos")
        .createSignedUrl(memo.storage_path, 3600);

      if (data?.signedUrl) setAudioUrl(data.signedUrl);
    };

    load();
  }, [voiceMemoId]);

  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const currentPosition = status.currentTime ?? 0;
  const durationSec = status.duration > 0 ? status.duration : storedDurationMs / 1000;
  const progress = durationSec > 0 ? Math.min(currentPosition / durationSec, 1) : 0;

  const handlePress = async () => {
    if (!audioUrl) return;
    if (isPlaying) {
      player.pause();
      return;
    }
    // A finished player stays parked at the end; rewind before replaying.
    if (durationSec > 0 && currentPosition >= durationSec - 0.1) {
      await player.seekTo(0);
    }
    player.play();
  };

  const ink = isOwn ? color.bubbleOwnText : color.bubbleTheirsText;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`Voice memo, ${formatDuration(durationSec * 1000)}. ${isPlaying ? "Pause" : "Play"}.`}
      style={[
        styles.bubble,
        isOwn ? styles.own : styles.theirs,
        { backgroundColor: isOwn ? color.bubbleOwn : color.bubbleTheirs },
        groupEnd && (isOwn ? styles.tailOwn : styles.tailTheirs),
      ]}
    >
      <Icon name={isPlaying ? "pause" : "play"} size={18} color={ink} />
      <View style={styles.track}>
        <View style={[styles.trackBg, { backgroundColor: ink, opacity: 0.25 }]} />
        <View style={[styles.trackFill, { backgroundColor: ink, width: `${progress * 100}%` }]} />
      </View>
      <Text style={[typeScale.footnote, styles.duration, { color: ink }]}>
        {isPlaying
          ? formatDuration(currentPosition * 1000)
          : formatDuration(durationSec * 1000)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: 230,
    maxWidth: "80%",
    borderRadius: radius.bubble,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  own: { alignSelf: "flex-end" },
  theirs: { alignSelf: "flex-start" },
  tailOwn: { borderBottomRightRadius: 6 },
  tailTheirs: { borderBottomLeftRadius: 6 },
  track: { flex: 1, height: 3, justifyContent: "center" },
  trackBg: { position: "absolute", left: 0, right: 0, height: 3, borderRadius: 2 },
  trackFill: { height: 3, borderRadius: 2 },
  duration: { fontVariant: ["tabular-nums"] },
});
