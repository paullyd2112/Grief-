import { Tabs } from "expo-router/js-tabs";
import { Icon } from "../../../src/components/ui";
import { fonts, hairlineWidth, useTheme } from "../../../src/theme";

// Two tabs: your conversations, and you (profile and settings). The tab bar
// is ink, not accent, so the accent stays meaningful.
export default function TabsLayout() {
  const { color } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.text,
        tabBarInactiveTintColor: color.textTertiary,
        tabBarStyle: {
          backgroundColor: color.background,
          borderTopColor: color.hairline,
          borderTopWidth: hairlineWidth,
        },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: color.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Conversations",
          tabBarIcon: ({ focused, color: tint }) => (
            <Icon name={focused ? "conversationsFill" : "conversations"} size={22} color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "You",
          tabBarIcon: ({ focused, color: tint }) => (
            <Icon name={focused ? "personFill" : "person"} size={22} color={tint} />
          ),
        }}
      />
    </Tabs>
  );
}
