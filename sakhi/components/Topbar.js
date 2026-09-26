// // components/Topbar.js
// "use client";

// const TITLES = {
//   "/": "Dashboard",
//   "/scheme-discovery": "Scheme Discovery",
//   "/eligibility": "Eligibility Check",
//   "/application-support": "Application Support",
//   "/track-applications": "Track Applications",
//   "/saved-schemes": "Saved Schemes",
//   "/documents": "Uploaded Documents",
//   "/ai-assistant": "AI Assistant",
//   "/languages": "Languages",
//   "/feedback": "Feedback",
//   "/settings": "Settings",
// };

// import { usePathname } from "next/navigation";

// export default function Topbar() {
//   const pathname = usePathname();
//   const title =
//     TITLES[pathname] ||
//     (Object.keys(TITLES).find((p) => p !== "/" && pathname.startsWith(p))
//       ? TITLES[Object.keys(TITLES).find((p) => p !== "/" && pathname.startsWith(p))]
//       : "Yojana Sakhi AI");

//   return (
//     <header className="topbar">
//       <div className="topbar-title">{title}</div>
//       <div className="topbar-actions">
//         <span className="pill">🇮🇳 Bharat</span>
//         <span className="pill">
//           <span className="dot" /> Live Prototype
//         </span>
//         <div className="avatar">YS</div>
//       </div>
//     </header>
//   );
// }

// components/Topbar.js
"use client";

const TITLES = {
  "/": "Dashboard",
  "/scheme-discovery": "Scheme Discovery",
  "/eligibility": "Eligibility Check",
  "/application-support": "Application Support",
  "/track-applications": "Track Applications",
  "/saved-schemes": "Saved Schemes",
  "/documents": "Uploaded Documents",
  "/ai-assistant": "AI Assistant",
  "/languages": "Languages",
  "/feedback": "Feedback",
  "/settings": "Settings",
};

import { usePathname } from "next/navigation";
import LanguageSelector from "./LanguageSelector";

export default function Topbar() {
  const pathname = usePathname();
  const title =
    TITLES[pathname] ||
    (Object.keys(TITLES).find((p) => p !== "/" && pathname.startsWith(p))
      ? TITLES[Object.keys(TITLES).find((p) => p !== "/" && pathname.startsWith(p))]
      : "Yojana Sakhi AI");

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        <LanguageSelector />
        <span className="pill">🇮🇳 Bharat</span>
        <span className="pill">
          <span className="dot" /> Live Prototype
        </span>
        <div className="avatar">YS</div>
      </div>
    </header>
  );
}
