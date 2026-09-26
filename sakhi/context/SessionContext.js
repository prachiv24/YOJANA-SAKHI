// context/SessionContext.js
//
// Was: one random UUID generated per browser and stashed in localStorage.
// Now: sessionId is the logged-in citizen's Supabase Auth user ID instead —
// so a citizen's profile, chats, and documents follow them across devices
// once they log in, rather than being stuck to one browser.
//
// Every existing page reads this the exact same way it always has —
// `const { sessionId } = useSession()` — so nothing else in the app needed
// to change. sessionId is null until a session is confirmed (or confirmed
// absent), same as before.

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";

const SessionContext = createContext({
  sessionId: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseClient) {
      setLoading(false);
      return;
    }

    supabaseClient.auth
      .getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        // If the Supabase project is unreachable (bad URL, paused project,
        // no network) this would otherwise hang `loading` at true forever
        // and throw an unhandled "Failed to fetch" on every page load.
        console.error("[SessionContext] getSession() failed:", err);
        setUser(null);
        setLoading(false);
      });

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    setUser(null);
  }

  return (
    <SessionContext.Provider
      value={{
        sessionId: user?.id ?? null,
        user,
        loading,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
