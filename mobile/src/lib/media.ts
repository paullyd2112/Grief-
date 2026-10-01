// Photos and videos in conversations: picking, shrinking, uploading, sending,
// saving, and copying for a report. Rules are enforced by the database
// (supabase/migrations/0015_attachments_unsend.sql); the limits here only
// stop people waiting on an upload that would be refused.

import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File, Paths } from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type { Attachment, AttachmentKind } from "./types";

export const ATTACHMENTS_BUCKET = "attachments";
export const REPORTED_MEDIA_BUCKET = "reported-media";

export const MAX_ITEMS_PER_MESSAGE = 10;
export const MAX_VIDEO_MS = 60_000;
export const MAX_CAPTION_LENGTH = 2000;

// About what iMessage and WhatsApp send: indistinguishable on a phone screen,
// roughly 0.5 MB instead of 3-5 MB. Re-encoding also drops the photo's hidden
// metadata, including where it was taken.
const MAX_PHOTO_EDGE = 2048;
const PHOTO_QUALITY = 0.8;

// The bucket refuses anything larger. A 60-second 720p video is ~12 MB.
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

// Signed links to view a file last an hour, like voice memos.
const SIGNED_URL_SECONDS = 3600;

export class MediaError extends Error {}

export interface PickedMedia {
  kind: AttachmentKind;
  uri: string;
  width: number;
  height: number;
  durationMs: number | null;
  mimeType: string | null;
}

// Opens the photo library. The system picker needs no permission prompt.
export async function pickMedia(limit: number): Promise<PickedMedia[] | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    allowsMultipleSelection: true,
    selectionLimit: Math.max(1, Math.min(limit, MAX_ITEMS_PER_MESSAGE)),
    orderedSelection: true,
    exif: false,
    quality: 1,
    // iOS exports videos at 720p before handing them over.
    videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
  });
  if (result.canceled) return null;

  return result.assets.slice(0, MAX_ITEMS_PER_MESSAGE).map((asset) => ({
    kind: asset.type === "video" ? "video" : "photo",
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ?? null,
    mimeType: asset.mimeType ?? null,
  }));
}

export function tooLongVideos(items: PickedMedia[]): number {
  return items.filter(
    (item) => item.kind === "video" && (item.durationMs ?? 0) > MAX_VIDEO_MS + 1000
  ).length;
}

interface PreparedFile {
  uri: string;
  width: number;
  height: number;
  contentType: string;
  extension: string;
}

async function preparePhoto(item: PickedMedia): Promise<PreparedFile> {
  const context = ImageManipulator.manipulate(item.uri);
  if (Math.max(item.width, item.height) > MAX_PHOTO_EDGE) {
    context.resize(
      item.width >= item.height ? { width: MAX_PHOTO_EDGE } : { height: MAX_PHOTO_EDGE }
    );
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: PHOTO_QUALITY, format: SaveFormat.JPEG });
  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
    contentType: "image/jpeg",
    extension: "jpg",
  };
}

function prepareVideo(item: PickedMedia): PreparedFile {
  const isMov = item.mimeType === "video/quicktime" || item.uri.toLowerCase().endsWith(".mov");
  return {
    uri: item.uri,
    width: item.width,
    height: item.height,
    contentType: isMov ? "video/quicktime" : "video/mp4",
    extension: isMov ? "mov" : "mp4",
  };
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

// Shrinks, uploads and sends. On any failure, removes what it uploaded and
// rethrows, so nothing is left half-sent.
export async function sendMedia(params: {
  conversationId: string;
  senderId: string;
  items: PickedMedia[];
  caption: string;
  allowSave: boolean;
  onProgress?: (done: number, total: number) => void;
}) {
  const { conversationId, senderId, items, caption, allowSave, onProgress } = params;
  if (items.length === 0) return;
  if (tooLongVideos(items) > 0) {
    throw new MediaError("Videos can be up to 60 seconds. Trim it in Photos first, then try again.");
  }

  const bucket = supabase.storage.from(ATTACHMENTS_BUCKET);
  const uploaded: string[] = [];
  const payload: Record<string, unknown>[] = [];

  try {
    for (const [index, item] of items.entries()) {
      const file = item.kind === "photo" ? await preparePhoto(item) : prepareVideo(item);
      const source = new File(file.uri);
      if ((source.size ?? 0) > MAX_UPLOAD_BYTES) {
        throw new MediaError("That video is too large to send. Try a shorter clip.");
      }

      // The sender's id prefix is how the database knows who uploaded it.
      const path = `${conversationId}/${senderId}-${Date.now()}-${index}-${randomSuffix()}.${file.extension}`;
      const { error } = await bucket.upload(path, await source.bytes(), {
        contentType: file.contentType,
      });
      if (error) throw error;
      uploaded.push(path);

      payload.push({
        kind: item.kind,
        path,
        width: file.width,
        height: file.height,
        duration_ms: item.kind === "video" ? Math.max(1, Math.round(item.durationMs ?? 1)) : null,
      });
      onProgress?.(index + 1, items.length);
    }

    const { error } = await supabase.rpc("send_media", {
      conv: conversationId,
      items: payload,
      caption: caption.trim() || null,
      can_save: allowSave,
    });
    if (error) throw error;
  } catch (e) {
    if (uploaded.length > 0) await bucket.remove(uploaded);
    throw e;
  }
}

export interface ViewableAttachment extends Attachment {
  url: string | null;
}

export async function loadAttachments(messageId: string): Promise<ViewableAttachment[]> {
  const { data } = await supabase
    .from("attachments")
    .select("*")
    .eq("message_id", messageId)
    .order("position");
  const rows = (data ?? []) as Attachment[];
  if (rows.length === 0) return [];

  const { data: signed } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrls(
      rows.map((row) => row.storage_path),
      SIGNED_URL_SECONDS
    );
  const urlFor = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return rows.map((row) => ({ ...row, url: urlFor.get(row.storage_path) ?? null }));
}

// Only offered when the sender allowed it.
export async function saveToPhotos(attachment: ViewableAttachment) {
  if (!attachment.url) throw new MediaError("Couldn't load it. Try again in a moment.");
  // Loaded here rather than at the top: it's only needed for Save, and it has
  // no web implementation (the design preview runs on web).
  const MediaLibrary = await import("expo-media-library");
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new MediaError("Allow Ndo to add to your photo library in Settings, then try again.");
  }
  const extension = attachment.storage_path.split(".").pop() ?? "jpg";
  const destination = new File(Paths.cache, `ndo-${Date.now()}.${extension}`);
  const file = await File.downloadFileAsync(attachment.url, destination);
  try {
    await MediaLibrary.Asset.create(file.uri);
  } finally {
    file.delete();
  }
}

// Unsend: the database clears the message and returns the files to remove.
// Removing them here is immediate; the retention job catches any that fail.
export async function unsendMessage(messageId: string) {
  const { data, error } = await supabase.rpc("unsend_message", { msg: messageId });
  if (error) throw error;
  const paths = (data ?? []) as string[];
  const media = paths.filter((p) => !p.endsWith(".m4a"));
  const audio = paths.filter((p) => p.endsWith(".m4a"));
  if (media.length) await supabase.storage.from(ATTACHMENTS_BUCKET).remove(media);
  if (audio.length) await supabase.storage.from("voice-memos").remove(audio);
}

export interface ReportedAttachment {
  kind: AttachmentKind;
  report_path: string | null;
  duration_ms: number | null;
}

// A report has to show what was sent, so the reporter's app copies the photos
// and videos into a folder only operators can read. Like the text snapshot,
// it's a copy that survives unsend and deletion. A failed copy never blocks
// the report itself.
export async function copyForReport(
  reporterId: string,
  messageIds: string[]
): Promise<Map<string, ReportedAttachment[]>> {
  const byMessage = new Map<string, ReportedAttachment[]>();
  if (messageIds.length === 0) return byMessage;

  const { data } = await supabase
    .from("attachments")
    .select("*")
    .in("message_id", messageIds)
    .order("position");
  const folder = `${reporterId}/${Date.now()}-${randomSuffix()}`;
  const bucket = supabase.storage.from(ATTACHMENTS_BUCKET);

  for (const row of (data ?? []) as Attachment[]) {
    const destination = `${folder}/${row.storage_path.split("/").pop()}`;
    const { error } = await bucket.copy(row.storage_path, destination, {
      destinationBucket: REPORTED_MEDIA_BUCKET,
    });
    const list = byMessage.get(row.message_id) ?? [];
    list.push({
      kind: row.kind,
      report_path: error ? null : destination,
      duration_ms: row.duration_ms,
    });
    byMessage.set(row.message_id, list);
  }
  return byMessage;
}

// "Photo", "Video", "3 photos", "2 photos and a video".
export function describeAttachments(kinds: AttachmentKind[]): string {
  const photos = kinds.filter((k) => k === "photo").length;
  const videos = kinds.length - photos;
  const part = (n: number, one: string, many: string) =>
    n === 0 ? null : n === 1 ? one : `${n} ${many}`;
  const bits = [
    part(photos, photos === kinds.length ? "Photo" : "a photo", "photos"),
    part(videos, videos === kinds.length ? "Video" : "a video", "videos"),
  ].filter(Boolean) as string[];
  const text = bits.join(" and ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------------------
// Preferences (this device only)
// ---------------------------------------------------------------------------

const SHOW_RIGHT_AWAY_KEY = "ndo.media.showRightAway";
const EXPLAINER_SEEN_KEY = "ndo.media.explainerSeen";

export async function getShowRightAway(): Promise<boolean> {
  return (await AsyncStorage.getItem(SHOW_RIGHT_AWAY_KEY)) === "1";
}

export async function setShowRightAway(value: boolean) {
  await AsyncStorage.setItem(SHOW_RIGHT_AWAY_KEY, value ? "1" : "0");
}

export async function getExplainerSeen(): Promise<boolean> {
  return (await AsyncStorage.getItem(EXPLAINER_SEEN_KEY)) === "1";
}

export async function markExplainerSeen() {
  await AsyncStorage.setItem(EXPLAINER_SEEN_KEY, "1");
}
