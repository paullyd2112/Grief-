import { useRef, useState, useCallback } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";
import * as FileSystem from "expo-file-system";

const MAX_DURATION_MS = 120_000; // 2 minutes

export function useVoiceMemo(conversationId: string | undefined) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert(
        "Microphone needed",
        "Open Settings to allow Ndo to record voice memos."
      );
      return;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
    setDurationMs(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setDurationMs(elapsed);
      if (elapsed >= MAX_DURATION_MS) {
        stopRecording();
      }
    }, 100);
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    await recorder.stop();
    setRecording(false);

    const finalDuration = Date.now() - startTimeRef.current;
    setDurationMs(finalDuration);

    return { uri: recorder.uri, durationMs: finalDuration };
  }, [recorder]);

  const cancelRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    await recorder.stop();
    setRecording(false);
    setDurationMs(0);
  }, [recorder]);

  const sendVoiceMemo = useCallback(
    async (senderId: string) => {
      if (!conversationId || !recorder.uri) return;

      setUploading(true);
      try {
        const finalDuration = Date.now() - startTimeRef.current;
        const fileUri = recorder.uri;
        const fileName = `${conversationId}/${Date.now()}.m4a`;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) throw new Error("Recording file not found");

        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { error: uploadError } = await supabase.storage
          .from("voice-memos")
          .upload(fileName, decode(fileContent), {
            contentType: "audio/m4a",
          });

        if (uploadError) throw uploadError;

        const { data: memo, error: memoError } = await supabase
          .from("voice_memos")
          .insert({
            storage_path: fileName,
            duration_ms: Math.max(finalDuration, 1),
          })
          .select()
          .single();

        if (memoError) throw memoError;

        const { error: msgError } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: senderId,
          kind: "voice",
          voice_memo_id: memo.id,
        });

        if (msgError) throw msgError;

        setDurationMs(0);
      } catch {
        Alert.alert("Upload failed", "Check your connection and try again.");
      } finally {
        setUploading(false);
      }
    },
    [conversationId, recorder]
  );

  return {
    recording,
    uploading,
    durationMs,
    startRecording,
    stopRecording,
    cancelRecording,
    sendVoiceMemo,
  };
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
