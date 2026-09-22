import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../src/hooks/useAuth";
import { useProfile, useDobAttempt } from "../src/hooks/useProfile";

export default function RootLayout() {
  const { user, loading: authLoading } = useAuth();
  const { attempt, loading: dobLoading } = useDobAttempt(user?.id);
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading || (user && dobLoading) || (user && profileLoading)) return;
    setReady(true);

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (!user) return;

    if (attempt && !attempt.attempted) {
      if (!inAuthGroup) router.replace("/(auth)/age-gate");
      return;
    }

    if (attempt?.attempted && !attempt.passed) {
      router.replace("/(auth)/underage");
      return;
    }

    if (attempt?.passed && !profile) {
      if (segments.join("/") !== "(auth)/create-profile") {
        router.replace("/(auth)/create-profile");
      }
      return;
    }

    if (attempt?.passed && profile && inAuthGroup) {
      router.replace("/(app)");
    }
  }, [user, authLoading, dobLoading, profileLoading, attempt, profile, segments]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}
