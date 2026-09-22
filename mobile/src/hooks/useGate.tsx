import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

interface GateState {
  userId: string;
  dobAttempted: boolean;
  dobPassed: boolean;
  hasProfile: boolean;
}

interface GateContextValue {
  user: User | null;
  authLoading: boolean;
  gate: GateState | null;
  refreshGate: () => Promise<void>;
}

const GateContext = createContext<GateContextValue | null>(null);

async function fetchGate(userId: string): Promise<GateState> {
  const [{ data: dob }, { data: profile }] = await Promise.all([
    supabase.from("dob_attempts").select("passed").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("id").eq("id", userId).maybeSingle(),
  ]);
  return {
    userId,
    dobAttempted: !!dob,
    dobPassed: !!dob?.passed,
    hasProfile: !!profile,
  };
}

// One shared copy of the signup-gate state. Screens that change it (age gate,
// profile creation) must await refreshGate() before navigating, or the root
// layout will redirect based on what it saw before the change.
export function GateProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [gate, setGate] = useState<GateState | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchGate(userId).then((next) => {
      if (!cancelled) setGate(next);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refreshGate = useCallback(async () => {
    if (userId) setGate(await fetchGate(userId));
  }, [userId]);

  return (
    <GateContext.Provider value={{ user, authLoading, gate, refreshGate }}>
      {children}
    </GateContext.Provider>
  );
}

export function useGate() {
  const ctx = useContext(GateContext);
  if (!ctx) throw new Error("useGate must be used inside GateProvider");
  return ctx;
}
