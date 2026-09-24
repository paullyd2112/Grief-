import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";

/**
 * Terminal screen. The age gate failed and cannot be retried (one attempt,
 * enforced by the database). We surface crisis resources because a minor
 * who found this app through grief content may need them.
 */
export default function UnderageScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>We're sorry</Text>
      <Text style={styles.body}>
        Ndo is only available to people 18 and older. We hope to support younger
        people in the future, but we want to do it carefully and get it right.
      </Text>

      <View style={styles.resources}>
        <Text style={styles.resourcesTitle}>If you're grieving</Text>
        <Text style={styles.resource}>
          • The Dougy Center — grief support for young people{"\n"}
          dougy.org
        </Text>
        <Text style={styles.resource}>
          • 988 Suicide & Crisis Lifeline — call or text 988, 24/7
        </Text>
        <Text style={styles.resource}>
          • Crisis Text Line — text HOME to 741741
        </Text>
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
    marginBottom: 32,
  },
  resources: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
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
