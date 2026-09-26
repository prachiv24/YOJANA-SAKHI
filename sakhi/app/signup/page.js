"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "../../lib/supabaseClient";
import SakhiStamp from "../../components/SakhiStamp";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!supabaseClient) {
      setError("Signup isn't configured yet — Supabase keys are missing from .env.local.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message || "Couldn't create your account. Please try again.");
        return;
      }

      // If your Supabase project has "Confirm email" turned ON (the default),
      // signUp() succeeds but there's no active session yet — the citizen
      // needs to click the link in their inbox first. If it's turned OFF,
      // data.session is already set and we can go straight in.
      if (data.session) {
        router.push("/");
      } else {
        setCheckEmail(true);
      }
    } catch (err) {
      // supabase-js throws a plain "TypeError: Failed to fetch" when the
      // request to your Supabase project's auth endpoint never completes —
      // e.g. NEXT_PUBLIC_SUPABASE_URL is wrong/paused-project, or the
      // network/DNS request is being blocked.
      console.error("[signup] request to Supabase failed:", err);
      setError(
        "Couldn't reach the signup server. Double-check NEXT_PUBLIC_SUPABASE_URL in " +
          ".env.local, that the Supabase project isn't paused, and that you have a " +
          "network connection, then try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
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
          <h1 className="ys-auth-title">Check your email</h1>
          <p className="ys-auth-desc">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it, then come
            back here and log in.
          </p>
          <Link href="/login" className="ys-auth-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
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

        <h1 className="ys-auth-title">Create your account</h1>
        <p className="ys-auth-desc">
          One account keeps your profile, documents, and applications with you everywhere.
        </p>

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
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
            />
          </label>

          {error && <div className="ys-auth-error">{error}</div>}

          <button type="submit" className="ys-auth-btn" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="ys-auth-footer">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
