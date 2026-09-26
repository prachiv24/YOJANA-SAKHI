// components/AppShell.js
//
// The persistent sidebar + topbar frame every page renders inside — now
// also the auth gate. /login and /signup render full-screen with no
// sidebar/topbar (they need to work for someone who isn't authenticated
// yet). Every other route requires a logged-in citizen; unauthenticated
// visitors are redirected to /login before they see any app content.

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useSession } from "../context/SessionContext";

const PUBLIC_ROUTES = ["/login", "/signup"];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useSession();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicRoute) {
      router.replace("/login");
    }
  }, [loading, user, isPublicRoute, router]);

  // Auth pages own their entire screen — no sidebar/topbar chrome.
  if (isPublicRoute) {
    return children;
  }

  // Waiting to hear from Supabase whether a session exists, or about to
  // redirect an unauthenticated visitor — show a quiet loading state
  // instead of flashing the real app content first.
  if (loading || !user) {
    return <div className="ys-auth-loading">Checking your session…</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">
        <Topbar />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
