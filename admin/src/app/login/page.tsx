"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

// useSearchParams needs a Suspense boundary or the production build fails.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "not_admin"
      ? "This account is not an admin."
      : null
  );

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setStep("verify");
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: "email",
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Ndo Admin</h1>
        <p className="text-stone-500 mb-8">Matching console</p>

        {step === "email" ? (
          <>
            <label className="block text-sm text-stone-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              placeholder="you@example.com"
              className="w-full border border-stone-300 rounded-lg px-4 py-3 text-stone-900 placeholder:text-stone-400 mb-4 focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
            <button
              onClick={handleSendOtp}
              disabled={loading || !email.trim()}
              className="w-full bg-stone-900 text-white rounded-lg py-3 font-medium hover:bg-stone-800 disabled:opacity-50 transition"
            >
              {loading ? "Sending…" : "Continue"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-stone-600 mb-4">
              Code sent to {email}
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Enter code"
              autoFocus
              className="w-full border border-stone-300 rounded-lg px-4 py-3 text-stone-900 placeholder:text-stone-400 mb-4 focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
            <button
              onClick={handleVerify}
              disabled={loading || !otp.trim()}
              className="w-full bg-stone-900 text-white rounded-lg py-3 font-medium hover:bg-stone-800 disabled:opacity-50 transition"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
            <button
              onClick={() => {
                setStep("email");
                setOtp("");
              }}
              className="w-full mt-3 text-stone-500 text-sm hover:text-stone-700"
            >
              Use a different email
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
