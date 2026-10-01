import { StyleSheet, View } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { SupportLines } from "../../src/components/SupportLines";
import { Button, Screen, Text } from "../../src/components/ui";
import { space } from "../../src/theme";

/**
 * Terminal screen. The age gate failed and cannot be retried (one attempt,
 * enforced by the database). We surface crisis resources because a minor
 * who found this app through grief content may need them.
 */
export default function UnderageScreen() {
  const { signOut } = useAuth();

  return (
    <Screen
      centered
      footer={<Button title="Sign out" variant="secondary" block onPress={signOut} />}
    >
      <View style={styles.intro}>
        <Text variant="title1" accessibilityRole="header">
          {"We're sorry"}
        </Text>
        <Text variant="callout" color="textSecondary">
          Ndo is only available to people 18 and older. We hope to support younger people in the
          future, but we want to do it carefully and get it right.
        </Text>
      </View>

      <SupportLines
        heading="If you're grieving"
        lines={[
          {
            title: "The Dougy Center",
            detail: "Grief support for young people · dougy.org",
            url: "https://www.dougy.org",
          },
          {
            title: "988 Suicide & Crisis Lifeline",
            detail: "Call or text 988, 24/7",
            url: "tel:988",
          },
          {
            title: "Crisis Text Line",
            detail: "Text HOME to 741741",
            url: "sms:741741&body=HOME",
          },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.md, marginBottom: space.lg },
});
