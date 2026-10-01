import { Linking, StyleSheet, View } from "react-native";
import { Button, Screen, Text } from "../../src/components/ui";
import { radius, space, useTheme } from "../../src/theme";

const resources = [
  {
    name: "988 Suicide & Crisis Lifeline",
    description: "Call or text 988 — free, confidential, 24/7.",
    action: "tel:988",
    actionLabel: "Call 988",
    secondary: "sms:988",
    secondaryLabel: "Text 988",
  },
  {
    name: "Crisis Text Line",
    description: "Text HELLO to 741741 to reach a trained crisis counselor.",
    action: "sms:741741&body=HELLO",
    actionLabel: "Text HELLO",
  },
  {
    name: "International Association for Suicide Prevention",
    description: "Find a crisis center in your country.",
    action: "https://www.iasp.info/resources/Crisis_Centres/",
    actionLabel: "Find your country",
  },
  {
    name: "Alliance of Hope for Suicide Loss Survivors",
    description: "Community and support for people who have lost someone to suicide.",
    action: "https://allianceofhope.org",
    actionLabel: "Visit site",
  },
  {
    name: "The Compassionate Friends",
    description: "Support for families who have experienced the death of a child at any age.",
    action: "https://www.compassionatefriends.org",
    actionLabel: "Visit site",
  },
] as const;

export default function CrisisScreen() {
  const { color } = useTheme();
  return (
    <Screen underHeader>
      <View style={styles.intro}>
        <Text variant="title1" accessibilityRole="header">
          You are not alone
        </Text>
        <Text variant="callout" color="textSecondary">
          If you or someone you know is in immediate danger, call 911. The resources below are
          free and available anytime.
        </Text>
      </View>

      {resources.map((r, i) => (
        <View key={r.name} style={[styles.card, { backgroundColor: color.surface }]}>
          <Text variant="headline">{r.name}</Text>
          <Text variant="subhead" color="textSecondary">
            {r.description}
          </Text>
          <View style={styles.actions}>
            <Button
              title={r.actionLabel}
              // The first line is the one to reach for: it gets the filled button.
              variant={i === 0 ? "primary" : "secondary"}
              icon={r.action.startsWith("tel:") ? "phone" : r.action.startsWith("sms:") ? "message" : undefined}
              onPress={() => Linking.openURL(r.action)}
              style={styles.action}
            />
            {"secondary" in r && r.secondary && (
              <Button
                title={r.secondaryLabel}
                variant="secondary"
                icon="message"
                onPress={() => Linking.openURL(r.secondary)}
                style={styles.action}
              />
            )}
          </View>
        </View>
      ))}

      <Text variant="footnote" color="textTertiary" align="center">
        Ndo is a peer support platform, not a crisis service. If you need immediate help, please
        use the resources above.
      </Text>
      <Text variant="footnote" color="textTertiary" align="center">
        {"These are independent organizations. Listing them isn't a vetting or endorsement by Ndo. Use your own judgment when reaching out to any of them."}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.xs },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
  action: { flexGrow: 1 },
});
