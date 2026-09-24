import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { useGate } from "../../src/hooks/useGate";
import { supabase } from "../../src/lib/supabase";

const GRACE_DAYS = 30;

export default function AccountDeletedScreen() {
  const { signOut } = useAuth();
  const { gate, refreshGate } = useGate();
  const [restoring, setRestoring] = useState(false);

  const deleteOn = gate?.deletedAt
    ? new Date(new Date(gate.deletedAt).getTime() + GRACE_DAYS * 86_400_000)
    : null;

  const keepAccount = async () => {
    setRestoring(true);
    const { error } = await supabase.rpc("restore_my_account");
    if (error) {
      setRestoring(false);
      Alert.alert("Something went wrong", "Please try again.");
      return;
    }
    await refreshGate();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your account is being deleted</Text>
      <Text style={styles.body}>
        {deleteOn
          ? `It will be permanently deleted on ${deleteOn.toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}. Until then you can change your mind.`
          : "Until it's permanently deleted, you can change your mind."}
      </Text>
      <Text style={styles.body}>
        {"If you keep it, you'll go back into the queue to be matched. Conversations that ended when you deleted your account won't come back."}
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, restoring && styles.disabled]}
        onPress={keepAccount}
        disabled={restoring}
      >
        {restoring ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Keep my account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: "#57534E",
    lineHeight: 24,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  button: {
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#78716C",
    fontSize: 16,
  },
});
