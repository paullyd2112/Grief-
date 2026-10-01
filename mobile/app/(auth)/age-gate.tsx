import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useGate } from "../../src/hooks/useGate";
import { Button, Screen, Text } from "../../src/components/ui";
import { radius, space, useTheme } from "../../src/theme";

/**
 * Age gate — one attempt, enforced by the database.
 *
 * The DOB is stored as entered (not just pass/fail) per DECISIONS.md D5.
 * Primary key on user_id means a second insert throws a unique violation —
 * the form cannot teach someone the right answer by letting them retry.
 *
 * Because there's only one try, Continue stays off until the person has
 * actually chosen a date: an untouched picker must never be submitted.
 */
export default function AgeGateScreen() {
  const { user, refreshGate } = useGate();
  const router = useRouter();
  const { color, scheme } = useTheme();
  const today = new Date();
  // A starting point for the wheels only; it's never submitted untouched.
  const [date, setDate] = useState(
    () => new Date(today.getFullYear() - 30, today.getMonth(), today.getDate())
  );
  const [chosen, setChosen] = useState(false);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === "android") setShowAndroidPicker(false);
    if (event.type === "set" && picked) {
      setDate(picked);
      setChosen(true);
    }
  };

  const handleSubmit = async () => {
    if (!user || !chosen) return;

    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const dob = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    let age = today.getFullYear() - y;
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
      age--;
    }

    const passed = age >= 18;

    setLoading(true);
    const { error } = await supabase.from("dob_attempts").insert({
      user_id: user.id,
      date_of_birth: dob,
      passed,
    });
    await refreshGate();
    setLoading(false);

    if (error) {
      // Unique violation means they already tried; the refreshed gate state
      // lets the root layout route them to the right place.
      Alert.alert("You've already completed this step.");
      return;
    }

    if (passed) {
      router.replace("/(auth)/create-profile");
    } else {
      router.replace("/(auth)/underage");
    }
  };

  const formatted = date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Screen
      footer={
        <Button
          title="Continue"
          block
          loading={loading}
          disabled={!chosen}
          onPress={handleSubmit}
        />
      }
    >
      <View style={styles.intro}>
        <Text variant="title1" accessibilityRole="header">
          Before we start
        </Text>
        <Text variant="callout" color="textSecondary">
          Ndo is for adults 18 and older. Please enter your date of birth.
        </Text>
      </View>

      {Platform.OS === "ios" ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          maximumDate={today}
          minimumDate={new Date(1900, 0, 1)}
          onChange={onChange}
          themeVariant={scheme}
          textColor={color.text}
          style={styles.wheels}
        />
      ) : (
        <>
          <Pressable
            onPress={() => setShowAndroidPicker(true)}
            accessibilityRole="button"
            style={[styles.field, { backgroundColor: color.surfaceSunken }]}
          >
            <Text variant="body" color={chosen ? "text" : "textTertiary"}>
              {chosen ? formatted : "Choose your date of birth"}
            </Text>
          </Pressable>
          {showAndroidPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              maximumDate={today}
              minimumDate={new Date(1900, 0, 1)}
              onChange={onChange}
            />
          )}
        </>
      )}

      <Text variant="footnote" color="textTertiary">
        You can only enter this once. We store the date you entered, not just
        whether you passed.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm },
  wheels: { alignSelf: "stretch" },
  field: {
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
