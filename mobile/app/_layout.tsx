import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { GateProvider, useGate } from "../src/hooks/useGate";

function GatedSlot() {
  const { user, authLoading, gate } = useGate();
  const segments = useSegments();
  const router = useRouter();

  // The design preview renders sample data only and needs no account. It is
  // reachable in development builds only.
  const isDesignPreview = __DEV__ && segments[0] === "design-preview";

  // Gate state for a different (or no) user is stale; wait for the refresh.
  const ready = !authLoading && (!user || gate?.userId === user.id);

  useEffect(() => {
    if (!ready || isDesignPreview) return;

    const path = segments.join("/");
    const inAuthGroup = segments[0] === "(auth)";

    if (!user) {
      if (path !== "(auth)/login") router.replace("/(auth)/login");
    } else if (!gate?.dobAttempted) {
      if (path !== "(auth)/age-gate") router.replace("/(auth)/age-gate");
    } else if (!gate.dobPassed) {
      if (path !== "(auth)/underage") router.replace("/(auth)/underage");
    } else if (!gate.hasProfile) {
      if (path !== "(auth)/create-profile") router.replace("/(auth)/create-profile");
    } else if (gate.deletedAt) {
      if (path !== "(auth)/account-deleted") router.replace("/(auth)/account-deleted");
    } else if (gate.suspended) {
      if (path !== "(auth)/suspended") router.replace("/(auth)/suspended");
    } else if (inAuthGroup) {
      router.replace("/(app)");
    }
  }, [ready, isDesignPreview, user, gate, segments, router]);

  if (isDesignPreview) return <Slot />;
  if (!ready) return null;
  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // If fonts fail to load, carry on with the system fonts rather than block.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GateProvider>
      <StatusBar style="auto" />
      <GatedSlot />
    </GateProvider>
  );
}
