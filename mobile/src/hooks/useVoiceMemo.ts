import { useRef, useState, useCallback } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";
import { sendErrorMessage } from "../lib/send-errors";
import { File } from "expo-file-system";

// Long enough that nobody needs to move to another app to say something
// properly (DECISIONS.md O3). The database allows a few seconds of slack.
const MAX_DURATION_MS = 300_000; // 5 minutes

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

        // SDK 57 removed the old readAsStringAsync/getInfoAsync (they throw
        // at runtime), so read the recording with the File API.
        const file = new File(fileUri);
        if (!file.exists) throw new Error("Recording file not found");

        const { error: uploadError } = await supabase.storage
          .from("voice-memos")
          .upload(fileName, await file.bytes(), {
            contentType: "audio/m4a",
          });

        if (uploadError) throw uploadError;

        const { data: memo, error: memoError } = await supabase
          .from("voice_memos")
          .insert({
            storage_path: fileName,
            duration_ms: Math.min(Math.max(finalDuration, 1), MAX_DURATION_MS),
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
      } catch (e) {
        Alert.alert("Couldn't send", sendErrorMessage(e));
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
