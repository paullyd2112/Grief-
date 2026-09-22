import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { profile, loading, refetch: fetch };
}

/** Check if the current user has passed the age gate. */
export function useDobAttempt(userId: string | undefined) {
  const [attempt, setAttempt] = useState<{
    passed: boolean;
    attempted: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("dob_attempts")
      .select("passed")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAttempt({ passed: data.passed, attempted: true });
        } else {
          setAttempt({ passed: false, attempted: false });
        }
        setLoading(false);
      });
  }, [userId]);

  return { attempt, loading };
}
