import { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Image,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { type as typeScale, space } from "../theme";
import { MediaError, saveToPhotos, type ViewableAttachment } from "../lib/media";

function VideoItem({ url, active, width }: { url: string; active: boolean; width: number }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (!active) player.pause();
  }, [active, player]);

  return (
    <VideoView
      player={player}
      style={{ width, height: "100%" }}
      contentFit="contain"
      nativeControls
      allowsPictureInPicture={false}
    />
  );
}

// Full-screen photos and videos. Save only appears when the sender allowed it.
export function MediaViewer({
  visible,
  items,
  startIndex,
  canSave,
  onClose,
}: {
  visible: boolean;
  items: ViewableAttachment[];
  startIndex: number;
  canSave: boolean;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(startIndex);
  const [saving, setSaving] = useState(false);
  const listRef = useRef<FlatList<ViewableAttachment>>(null);

  const current = items[index];

  const handleSave = async () => {
    if (!current || saving) return;
    setSaving(true);
    try {
      await saveToPhotos(current);
      Alert.alert("Saved to Photos");
    } catch (e) {
      Alert.alert(
        "Couldn't save",
        e instanceof MediaError ? e.message : "Check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} supportedOrientations={["portrait"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={[typeScale.bodyMedium, styles.headerText]}>Done</Text>
          </Pressable>
          {items.length > 1 && (
            <Text style={[typeScale.subhead, styles.headerText]}>
              {index + 1} of {items.length}
            </Text>
          )}
          {canSave ? (
            <Pressable onPress={handleSave} hitSlop={12} disabled={saving} accessibilityRole="button">
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[typeScale.bodyMedium, styles.headerText]}>Save</Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(startIndex, Math.max(items.length - 1, 0))}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item, index: i }) => (
            <View style={{ width, flex: 1 }}>
              {!item.url ? (
                <ActivityIndicator color="#FFFFFF" style={styles.fill} />
              ) : item.kind === "photo" ? (
                <Image source={{ uri: item.url }} style={styles.fill} resizeMode="contain" />
              ) : (
                <VideoItem url={item.url} active={i === index} width={width} />
              )}
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  header: {
    paddingTop: 56,
    paddingBottom: space.md,
    paddingHorizontal: space.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: { color: "#FFFFFF" },
  headerSpacer: { width: 36 },
  fill: { flex: 1 },
});
