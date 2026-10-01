import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { SUPPORT_EMAIL } from "../../src/lib/config";
import { SupportLines } from "../../src/components/SupportLines";
import { Button, Screen, Text } from "../../src/components/ui";
import { space } from "../../src/theme";

// Still a grieving person on the other side of this screen, so crisis
// resources stay front and center.
export default function SuspendedScreen() {
  const { signOut } = useAuth();

  return (
    <Screen
      centered
      footer={<Button title="Sign out" variant="secondary" block onPress={signOut} />}
    >
      <View style={styles.intro}>
        <Text variant="title1" accessibilityRole="header">
          Your account is suspended
        </Text>
        <Text variant="callout" color="textSecondary">
          {"After reviewing a report, we've suspended your account for breaking the community guidelines. You can't be matched or send messages while it's suspended."}
        </Text>
        {!!SUPPORT_EMAIL && (
          <Pressable
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            accessibilityRole="link"
          >
            <Text variant="callout" color="accent">
              {`If you think this was a mistake, email ${SUPPORT_EMAIL}.`}
            </Text>
          </Pressable>
        )}
      </View>

      <SupportLines
        heading="If you need support right now"
        lines={[
          {
            title: "988 Suicide & Crisis Lifeline",
            detail: "Call or text 988, 24/7",
            url: "tel:988",
          },
          {
            title: "Crisis Text Line",
            detail: "Text HELLO to 741741",
            url: "sms:741741&body=HELLO",
          },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.md, marginBottom: space.lg },
});
