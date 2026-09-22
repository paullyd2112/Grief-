import { View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView } from "react-native";

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
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>You are not alone</Text>
        <Text style={styles.headerBody}>
          If you or someone you know is in immediate danger, call 911. The
          resources below are free and available anytime.
        </Text>
      </View>

      {resources.map((r) => (
        <View key={r.name} style={styles.card}>
          <Text style={styles.cardName}>{r.name}</Text>
          <Text style={styles.cardDesc}>{r.description}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() => Linking.openURL(r.action)}
            >
              <Text style={styles.cardButtonText}>{r.actionLabel}</Text>
            </TouchableOpacity>
            {"secondary" in r && r.secondary && (
              <TouchableOpacity
                style={[styles.cardButton, styles.cardButtonSecondary]}
                onPress={() => Linking.openURL(r.secondary)}
              >
                <Text style={[styles.cardButtonText, styles.cardButtonTextSecondary]}>
                  {r.secondaryLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <Text style={styles.footer}>
        Ndo is a peer support platform, not a crisis service. If you need
        immediate help, please use the resources above.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 8,
  },
  headerBody: {
    fontSize: 15,
    color: "#57534E",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: "#57534E",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  cardButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cardButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cardButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  cardButtonTextSecondary: {
    color: "#3B82F6",
  },
  footer: {
    textAlign: "center",
    color: "#A8A29E",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    paddingHorizontal: 8,
  },
});
