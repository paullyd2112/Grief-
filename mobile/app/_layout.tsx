import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../src/hooks/useAuth";
import { useDobAttempt } from "../src/hooks/useProfile";

export default function RootLayout() {
  const { user, loading: authLoading } = useAuth();
  const { attempt, loading: dobLoading } = useDobAttempt(user?.id);
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading || (user && dobLoading)) return;
    setReady(true);

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && attempt && !attempt.attempted && !inAuthGroup) {
      // Signed in but hasn't done the age gate yet
      router.replace("/(auth)/age-gate");
    } else if (user && attempt?.attempted && !attempt.passed) {
      // Failed the age gate — cannot proceed
      router.replace("/(auth)/underage");
    } else if (user && attempt?.passed && inAuthGroup) {
      // Authenticated and passed — send to app
      router.replace("/(app)");
    }
  }, [user, authLoading, dobLoading, attempt, segments]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}
