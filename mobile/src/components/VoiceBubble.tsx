import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { supabase } from "../lib/supabase";

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function VoiceBubble({
  voiceMemoId,
  isOwn,
  timestamp,
}: {
  voiceMemoId: string;
  isOwn: boolean;
  timestamp: string;
}) {
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

  return (
    <View
      style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleTheirs]}
    >
      <TouchableOpacity onPress={handlePress} style={styles.row}>
        <Text style={[styles.playIcon, isOwn ? styles.textOwn : styles.textTheirs]}>
          {isPlaying ? "⏸" : "▶"}
        </Text>
        <View style={styles.waveformContainer}>
          <View style={styles.waveformTrack}>
            <View
              style={[
                styles.waveformProgress,
                { width: `${progress * 100}%` },
                isOwn ? styles.progressOwn : styles.progressTheirs,
              ]}
            />
          </View>
          <Text
            style={[styles.duration, isOwn ? styles.textOwn : styles.textTheirs]}
          >
            {isPlaying
              ? formatDuration(currentPosition * 1000)
              : formatDuration(durationSec * 1000)}
          </Text>
        </View>
      </TouchableOpacity>
      <Text style={[styles.timestamp, isOwn ? styles.tsOwn : styles.tsTheirs]}>
        {new Date(timestamp).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 2,
  },
  bubbleOwn: {
    backgroundColor: "#3B82F6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: "#E5E7EB",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playIcon: {
    fontSize: 18,
  },
  textOwn: {
    color: "#FFFFFF",
  },
  textTheirs: {
    color: "#1C1917",
  },
  waveformContainer: {
    flex: 1,
    gap: 4,
  },
  waveformTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  waveformProgress: {
    height: "100%",
    borderRadius: 2,
  },
  progressOwn: {
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  progressTheirs: {
    backgroundColor: "#6B7280",
  },
  duration: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  tsOwn: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  tsTheirs: {
    color: "#6B7280",
  },
});
