import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/hooks/useAuth";

/**
 * Age gate — one attempt, enforced by the database.
 *
 * The DOB is stored as entered (not just pass/fail) per DECISIONS.md D5.
 * Primary key on user_id means a second insert throws a unique violation —
 * the form cannot teach someone the right answer by letting them retry.
 */
export default function AgeGateScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);

    if (!m || !d || !y || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) {
      Alert.alert("Please enter a valid date of birth.");
      return;
    }

    const dob = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const passed = age >= 18;

    setLoading(true);
    const { error } = await supabase.from("dob_attempts").insert({
      user_id: user.id,
      date_of_birth: dob,
      passed,
    });
    setLoading(false);

    if (error) {
      // Unique violation means they already tried — shouldn't happen in normal
      // flow since the root layout guards it, but handle gracefully.
      Alert.alert("You've already completed this step.");
      return;
    }

    if (passed) {
      router.replace("/(auth)/create-profile");
    } else {
      router.replace("/(auth)/underage");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Before we start</Text>
        <Text style={styles.subtitle}>
          Ndo is for adults 18 and older. Please enter your date of birth.
        </Text>

        <View style={styles.row}>
          <View style={styles.fieldSmall}>
            <Text style={styles.label}>Month</Text>
            <TextInput
              style={styles.input}
              value={month}
              onChangeText={setMonth}
              placeholder="MM"
              placeholderTextColor="#A8A29E"
              keyboardType="number-pad"
              maxLength={2}
              returnKeyType="next"
            />
          </View>
          <View style={styles.fieldSmall}>
            <Text style={styles.label}>Day</Text>
            <TextInput
              style={styles.input}
              value={day}
              onChangeText={setDay}
              placeholder="DD"
              placeholderTextColor="#A8A29E"
              keyboardType="number-pad"
              maxLength={2}
              returnKeyType="next"
            />
          </View>
          <View style={styles.fieldLarge}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              placeholder="YYYY"
              placeholderTextColor="#A8A29E"
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
          </View>
        </View>

        <Text style={styles.note}>
          You can only enter this once. We store the date you entered, not just
          whether you passed.
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
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
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#57534E",
    lineHeight: 24,
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  fieldSmall: {
    flex: 1,
  },
  fieldLarge: {
    flex: 1.5,
  },
  label: {
    fontSize: 13,
    color: "#78716C",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: "#1C1917",
    backgroundColor: "#fff",
    textAlign: "center",
  },
  note: {
    fontSize: 13,
    color: "#A8A29E",
    marginBottom: 24,
    lineHeight: 18,
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
});
