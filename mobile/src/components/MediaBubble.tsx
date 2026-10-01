import { useEffect, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useTheme, type as typeScale, radius, space } from "../theme";
import { describeAttachments, loadAttachments, type ViewableAttachment } from "../lib/media";
import { MediaViewer } from "./MediaViewer";
import type { Message } from "../lib/types";

function formatDuration(ms: number | null) {
  const total = Math.round((ms ?? 0) / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
}

// Photos and videos in a conversation. What someone else sends arrives as a
// plain "Tap to view" card: seeing a photo of someone's late mother pop up
// unexpectedly can hit hard, so people open it when they're ready. Long-press
// is handled by the conversation screen (unsend, report).
export function MediaBubble({
  message,
  isOwn,
  partnerName,
  showRightAway,
  showExplainer,
  onRevealed,
  onLongPress,
}: {
  message: Message;
  isOwn: boolean;
  partnerName: string;
  showRightAway: boolean;
  showExplainer: boolean;
  onRevealed: () => void;
  onLongPress: () => void;
}) {
  const { color } = useTheme();
  const [attachments, setAttachments] = useState<ViewableAttachment[]>([]);
  const [tapped, setTapped] = useState(false);
  const revealed = isOwn || showRightAway || tapped;
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (message.unsent_at) return;
    let cancelled = false;
    loadAttachments(message.id).then((rows) => {
      if (!cancelled) setAttachments(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [message.id, message.unsent_at]);

  const align = isOwn ? styles.alignOwn : styles.alignTheirs;

  if (message.unsent_at) {
    return (
      <Text style={[styles.unsent, align, { color: color.textTertiary }]}>
        {isOwn ? "You unsent a photo or video" : `${partnerName} unsent a photo or video`}
      </Text>
    );
  }

  const summary = attachments.length
    ? describeAttachments(attachments.map((a) => a.kind))
    : "Photo or video";
  // For "Maya sent …": "a photo", "a video", "3 photos", "2 photos and a video".
  const sentPhrase = /^(Photo|Video|Photo or video)$/.test(summary)
    ? `a ${summary.toLowerCase()}`
    : summary.charAt(0).toLowerCase() + summary.slice(1);

  const caption = message.body ? (
    <Text style={[typeScale.body, styles.caption, { color: color.text }]}>{message.body}</Text>
  ) : null;

  if (!revealed) {
    return (
      <View style={[styles.wrap, align]}>
        <Pressable
          onPress={() => {
            setTapped(true);
            onRevealed();
          }}
          onLongPress={onLongPress}
          accessibilityRole="button"
          accessibilityLabel={`${partnerName} sent ${sentPhrase}. Tap to view.`}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: color.surfaceSunken, borderColor: color.hairline },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[typeScale.subheadMedium, { color: color.text }]}>
            {partnerName} sent {sentPhrase}
          </Text>
          <Text style={[typeScale.footnote, { color: color.accent }]}>Tap to view</Text>
        </Pressable>
        {caption}
        {showExplainer && (
          <Text style={[typeScale.footnote, styles.explainer, { color: color.textTertiary }]}>
            Photos and videos open when you tap them, so you can choose when you&apos;re ready to
            see them.
          </Text>
        )}
      </View>
    );
  }

  const shown = attachments.slice(0, 4);
  const extra = attachments.length - shown.length;
  const single = attachments.length === 1;

  return (
    <View style={[styles.wrap, align]}>
      <Pressable onLongPress={onLongPress} delayLongPress={350}>
        <View style={[styles.grid, single && styles.gridSingle]}>
          {shown.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => setViewerIndex(index)}
              onLongPress={onLongPress}
              accessibilityRole="imagebutton"
              accessibilityLabel={item.kind === "video" ? "Video. Tap to play." : "Photo. Tap to open."}
              style={[
                styles.tile,
                single ? styles.tileSingle : styles.tileQuarter,
                { backgroundColor: color.surfaceSunken },
              ]}
            >
              {item.kind === "photo" && item.url ? (
                <Image source={{ uri: item.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.videoTile, { backgroundColor: color.text }]}>
                  <Text style={[typeScale.headline, { color: color.background }]}>▶</Text>
                  <Text style={[typeScale.caption, { color: color.background }]}>
                    {formatDuration(item.duration_ms)}
                  </Text>
                </View>
              )}
              {index === shown.length - 1 && extra > 0 && (
                <View style={[StyleSheet.absoluteFill, styles.more, { backgroundColor: color.scrim }]}>
                  <Text style={[typeScale.title3, { color: "#FFFFFF" }]}>+{extra}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </Pressable>
      {caption}

      <MediaViewer
        key={viewerIndex ?? "closed"}
        visible={viewerIndex !== null}
        items={attachments}
        startIndex={viewerIndex ?? 0}
        canSave={!isOwn && message.allow_save}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: "80%",
    gap: space.xs,
  },
  alignOwn: { alignSelf: "flex-end", alignItems: "flex-end" },
  alignTheirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.xxs,
    minWidth: 200,
  },
  caption: { paddingHorizontal: space.xs },
  explainer: { maxWidth: 260, paddingHorizontal: space.xs },
  unsent: {
    fontStyle: "italic",
    fontSize: 13,
    marginVertical: 4,
    paddingHorizontal: space.xs,
  },
  grid: {
    width: 240,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  gridSingle: { width: 240 },
  tile: { overflow: "hidden" },
  tileSingle: { width: 240, height: 240 },
  tileQuarter: { width: 119, height: 119 },
  videoTile: { alignItems: "center", justifyContent: "center", gap: space.xs },
  more: { alignItems: "center", justifyContent: "center" },
});
