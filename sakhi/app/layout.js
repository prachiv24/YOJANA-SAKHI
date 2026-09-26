import "./globals.css";
import { SessionProvider } from "../context/SessionContext";
import { LanguageProvider } from "../context/LanguageContext";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "Yojana Sakhi AI",
  description:
    "AI welfare companion helping Indian citizens discover and apply for government welfare schemes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <SessionProvider>
          <LanguageProvider>
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}