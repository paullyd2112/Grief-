import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth";

export default function LoginScreen() {
  const { signInWithOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error: err } = await signInWithOtp(email.trim().toLowerCase());
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setStep("verify");
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    setError(null);
    const { error: err } = await verifyOtp(email.trim().toLowerCase(), otp.trim());
    setLoading(false);
    if (err) {
      setError(err.message);
    }
    // On success, onAuthStateChange fires and _layout.tsx handles navigation
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Ndo</Text>
        <Text style={styles.subtitle}>
          Talk to someone who actually understands.
        </Text>

        {step === "email" ? (
          <>
            <Text style={styles.label}>Your email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#A8A29E"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleSendOtp}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>
              We sent a code to {email}
            </Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter your code"
              placeholderTextColor="#A8A29E"
              keyboardType="number-pad"
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleVerify}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setStep("email");
                setOtp("");
                setError(null);
              }}
            >
              <Text style={styles.backText}>Use a different email</Text>
            </TouchableOpacity>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <Text style={styles.footer}>
        Not therapy. If you're in crisis, call or text 988.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#57534E",
    marginBottom: 40,
    lineHeight: 26,
  },
  label: {
    fontSize: 15,
    color: "#44403C",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: "#1C1917",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#1C1917",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 16,
    alignItems: "center",
  },
  backText: {
    color: "#78716C",
    fontSize: 15,
  },
  error: {
    color: "#DC2626",
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    color: "#A8A29E",
    fontSize: 13,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
});
