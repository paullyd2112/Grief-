import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { SUPPORT_EMAIL } from "../../src/lib/config";

// Still a grieving person on the other side of this screen, so crisis
// resources stay front and center.
export default function SuspendedScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your account is suspended</Text>
      <Text style={styles.body}>
        {"After reviewing a report, we've suspended your account for breaking the community guidelines. You can't be matched or send messages while it's suspended."}
      </Text>

      {SUPPORT_EMAIL && (
        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Text style={styles.link}>
            {`If you think this was a mistake, email ${SUPPORT_EMAIL}.`}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.resources}>
        <Text style={styles.resourcesTitle}>If you need support right now</Text>
        <TouchableOpacity onPress={() => Linking.openURL("tel:988")}>
          <Text style={styles.resource}>
            • 988 Suicide & Crisis Lifeline — call or text 988, 24/7
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL("sms:741741&body=HELLO")}>
          <Text style={styles.resource}>• Crisis Text Line — text HELLO to 741741</Text>
        </TouchableOpacity>
      </View>

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
  link: {
    fontSize: 15,
    color: "#3B82F6",
    lineHeight: 22,
    marginBottom: 16,
  },
  resources: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  resourcesTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 12,
  },
  resource: {
    fontSize: 14,
    color: "#57534E",
    lineHeight: 20,
    marginBottom: 10,
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
