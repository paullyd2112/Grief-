import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Screen, Text, TextField } from "../../src/components/ui";
import { fonts, space, useTheme } from "../../src/theme";
import { useAuth } from "../../src/hooks/useAuth";

function TextLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}
    >
      <Text variant="subhead" color="textSecondary" align="center">
        {title}
      </Text>
    </Pressable>
  );
}

export default function LoginScreen() {
  const { color } = useTheme();
  const { signInWithOtp, verifyOtp, signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "verify" | "password">("email");
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

  const handlePasswordSignIn = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const { error: err } = await signInWithPassword(email.trim().toLowerCase(), password);
    setLoading(false);
    if (err) {
      // Supabase says "Invalid login credentials" for both a wrong password
      // and an account that has never set one.
      setError(
        "That email and password don't match. If you haven't set a password yet, sign in with a code and add one in Settings."
      );
    }
    // On success, onAuthStateChange fires and _layout.tsx handles navigation
  };

  const switchTo = (next: "email" | "password") => {
    setStep(next);
    setOtp("");
    setPassword("");
    setError(null);
  };

  return (
    <Screen
      centered
      footer={
        <Text variant="footnote" color="textTertiary" align="center">
          {"Not therapy. If you're in crisis, call or text 988."}
        </Text>
      }
    >
      {/* The brand moment: the wordmark and one line, nothing else. */}
      <View style={styles.brand}>
        <Text variant="display" accessibilityRole="header">
          Ndo
        </Text>
        <Text style={[styles.tagline, { color: color.textSecondary }]}>
          Talk to someone who actually understands.
        </Text>
      </View>

      {step === "email" ? (
        <View style={styles.form}>
          <TextField
            label="Your email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="go"
            onSubmitEditing={handleSendOtp}
          />
          <Button title="Continue" block loading={loading} onPress={handleSendOtp} />
          <TextLink title="Sign in with a password" onPress={() => switchTo("password")} />
        </View>
      ) : step === "password" ? (
        <View style={styles.form}>
          <TextField
            label="Your email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="email"
            returnKeyType="next"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handlePasswordSignIn}
          />
          <Button title="Sign in" block loading={loading} onPress={handlePasswordSignIn} />
          <TextLink title="Forgot it? Email me a code instead" onPress={() => switchTo("email")} />
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            label="Your code"
            helper={`We sent it to ${email}`}
            value={otp}
            onChangeText={setOtp}
            placeholder="6-digit code"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoFocus
            returnKeyType="go"
            onSubmitEditing={handleVerify}
          />
          <Button title="Verify" block loading={loading} onPress={handleVerify} />
          <TextLink
            title="Use a different email"
            onPress={() => {
              setStep("email");
              setOtp("");
              setError(null);
            }}
          />
        </View>
      )}

      {error && (
        <Text variant="footnote" color="danger" align="center">
          {error}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { gap: space.sm, marginBottom: space.xxl },
  // Instrument Serif's own italic, not a slanted regular.
  tagline: { fontFamily: fonts.serifItalic, fontSize: 24, lineHeight: 30 },
  form: { gap: space.lg },
  link: { paddingVertical: space.xs },
});
