import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GateProvider, useGate } from "../src/hooks/useGate";

function GatedSlot() {
  const { user, authLoading, gate } = useGate();
  const segments = useSegments();
  const router = useRouter();

  // Gate state for a different (or no) user is stale; wait for the refresh.
  const ready = !authLoading && (!user || gate?.userId === user.id);

  useEffect(() => {
    if (!ready) return;

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
    } else if (inAuthGroup) {
      router.replace("/(app)");
    }
  }, [ready, user, gate, segments, router]);

  if (!ready) return null;
  return <Slot />;
}

export default function RootLayout() {
  return (
    <GateProvider>
      <StatusBar style="auto" />
      <GatedSlot />
    </GateProvider>
  );
}
