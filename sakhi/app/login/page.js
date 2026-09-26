"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "../../lib/supabaseClient";
import SakhiStamp from "../../components/SakhiStamp";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!supabaseClient) {
      setError("Login isn't configured yet — Supabase keys are missing from .env.local.");
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || "Couldn't log in. Check your email and password.");
        return;
      }

      router.push("/");
    } catch (err) {
      // supabase-js throws a plain "TypeError: Failed to fetch" when the
      // request to your Supabase project's auth endpoint never completes —
      // e.g. NEXT_PUBLIC_SUPABASE_URL is wrong/paused-project, or the
      // network/DNS request is being blocked.
      console.error("[login] request to Supabase failed:", err);
      setError(
        "Couldn't reach the login server. Double-check NEXT_PUBLIC_SUPABASE_URL in " +
          ".env.local, that the Supabase project isn't paused, and that you have a " +
          "network connection, then try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ys-auth-screen">
      <div className="ys-auth-card">
        <div className="ys-auth-brand">
          <SakhiStamp size={56} />
          <div>
            <div className="ys-auth-name">YOJANA SAKHI AI</div>
            <div className="ys-auth-sub">Government of India · Digital Seva</div>
          </div>
        </div>

        <h1 className="ys-auth-title">Welcome back</h1>
        <p className="ys-auth-desc">Log in to pick up your saved profile, documents, and applications.</p>

        <form onSubmit={handleSubmit} className="ys-auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          {error && <div className="ys-auth-error">{error}</div>}

          <button type="submit" className="ys-auth-btn" disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className="ys-auth-footer">
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
