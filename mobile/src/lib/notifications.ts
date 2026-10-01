// Push notifications. The database decides when to send them and never puts
// what anyone wrote in them (supabase/migrations/0016_push_notifications.sql);
// this file registers the phone and decides what to show while the app is open.

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { supabase } from "./supabase";

const TOKEN_KEY = "ndo.push.token";

// The conversation on screen right now: no banner for a message you're
// already looking at.
let activeConversationId: string | null = null;

export function setActiveConversation(id: string | null) {
  activeConversationId = id;
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const conversationId = notification.request.content.data?.conversation_id;
    const alreadyThere = !!conversationId && conversationId === activeConversationId;
    return {
      shouldShowBanner: !alreadyThere,
      shouldShowList: !alreadyThere,
      shouldPlaySound: !alreadyThere,
      shouldSetBadge: false,
    };
  },
});

// `ask`: only prompt for permission at a moment where it makes sense (after
// intake: "we'll let you know when you're matched"). Otherwise this just
// refreshes the token if permission was already given.
export async function registerForPush({ ask }: { ask: boolean }) {
  try {
    if (Platform.OS === "web" || !Device.isDevice) return;

    // Set by `eas init`. Without it Expo can't issue a push token.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      if (!ask) return;
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Messages",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc("register_push_token", {
      push_token: token,
      device_platform: Platform.OS,
    });
    if (!error) await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Notifications are a nicety; never let them break the app.
  }
}

// On sign-out, so the next person to use this phone doesn't get your alerts.
export async function unregisterForPush() {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await supabase.rpc("unregister_push_token", { push_token: token });
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // Signing out must still work offline.
  }
}
