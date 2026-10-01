import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme, type as typeScale, radius, space } from "../theme";
import { MAX_CAPTION_LENGTH, MAX_VIDEO_MS, type PickedMedia } from "../lib/media";

function formatDuration(ms: number | null) {
  const total = Math.round((ms ?? 0) / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
}

// The step between picking and sending: check what's going, add a caption,
// and decide whether the other person may save it.
export function MediaComposer({
  visible,
  items,
  partnerName,
  sending,
  progress,
  onRemove,
  onCancel,
  onSend,
}: {
  visible: boolean;
  items: PickedMedia[];
  partnerName: string;
  sending: boolean;
  progress: { done: number; total: number } | null;
  onRemove: (index: number) => void;
  onCancel: () => void;
  onSend: (caption: string, allowSave: boolean) => void;
}) {
  const { color } = useTheme();
  const [caption, setCaption] = useState("");
  // Saving is off unless the sender turns it on. The parent remounts this
  // (key) for each new batch, so every batch starts fresh.
  const [allowSave, setAllowSave] = useState(false);

  const tooLong = items.some((i) => i.kind === "video" && (i.durationMs ?? 0) > MAX_VIDEO_MS + 1000);
  const canSend = items.length > 0 && !tooLong && !sending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: color.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onCancel} disabled={sending} hitSlop={12} accessibilityRole="button">
            <Text style={[typeScale.body, { color: color.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Text style={[typeScale.headline, { color: color.text }]}>
            {items.length === 1 ? "1 item" : `${items.length} items`}
          </Text>
          <Pressable
            onPress={() => onSend(caption, allowSave)}
            disabled={!canSend}
            hitSlop={12}
            accessibilityRole="button"
          >
            <Text style={[typeScale.headline, { color: canSend ? color.accent : color.textTertiary }]}>
              {sending ? "Sending" : "Send"}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {items.map((item, index) => {
              const overLimit = item.kind === "video" && (item.durationMs ?? 0) > MAX_VIDEO_MS + 1000;
              return (
                <View key={`${item.uri}-${index}`} style={[styles.thumb, { backgroundColor: color.surfaceSunken }]}>
                  {item.kind === "photo" ? (
                    <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, styles.video, { backgroundColor: color.text }]}>
                      <Text style={[typeScale.caption, { color: overLimit ? "#F4B4AE" : color.background }]}>
                        ▶ {formatDuration(item.durationMs)}
                      </Text>
                    </View>
                  )}
                  {!sending && (
                    <Pressable
                      onPress={() => onRemove(index)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Remove"
                      style={[styles.remove, { backgroundColor: color.scrim }]}
                    >
                      <Text style={styles.removeText}>×</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {tooLong && (
            <Text style={[typeScale.footnote, { color: color.danger }]}>
              Videos can be up to 60 seconds. Remove the longer one, or trim it in Photos first.
            </Text>
          )}

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a caption (optional)"
            placeholderTextColor={color.textTertiary}
            multiline
            maxLength={MAX_CAPTION_LENGTH}
            editable={!sending}
            style={[
              typeScale.body,
              styles.caption,
              { backgroundColor: color.surfaceSunken, color: color.text },
            ]}
          />

          <View style={[styles.saveRow, { borderColor: color.hairline }]}>
            <View style={styles.saveText}>
              <Text style={[typeScale.bodyMedium, { color: color.text }]}>
                Let {partnerName} save {items.length === 1 ? "it" : "these"}
              </Text>
              <Text style={[typeScale.footnote, { color: color.textSecondary }]}>
                {allowSave
                  ? `${partnerName} can save ${items.length === 1 ? "it" : "them"} to their phone.`
                  : `${partnerName} can view ${items.length === 1 ? "it" : "them"} in Ndo but can't save. A screenshot is still possible.`}
              </Text>
            </View>
            <Switch value={allowSave} onValueChange={setAllowSave} disabled={sending} />
          </View>

          {progress && (
            <Text style={[typeScale.footnote, { color: color.textSecondary }]}>
              Sending {progress.done} of {progress.total}…
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  body: { paddingHorizontal: space.xl, paddingBottom: space.xxxl, gap: space.lg },
  strip: { gap: space.sm },
  thumb: { width: 96, height: 96, borderRadius: radius.md, overflow: "hidden" },
  video: { alignItems: "center", justifyContent: "center" },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: "#FFFFFF", fontSize: 16, lineHeight: 18 },
  caption: {
    minHeight: 88,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    textAlignVertical: "top",
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.md,
  },
  saveText: { flex: 1, gap: space.xxs },
});
