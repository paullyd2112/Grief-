import { useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  }, []);

  const verifyOtp = useCallback(
    async (email: string, token: string) => {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      return { data, error };
    },
    []
  );

  // Password sign-in is an alternative to the email code for members who
  // have set a password (Settings > Password). Accounts are still created
  // with a code, which proves the member owns the email address.
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const setPassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user,
    loading,
    signInWithOtp,
    verifyOtp,
    signInWithPassword,
    setPassword,
    signOut,
  };
}
