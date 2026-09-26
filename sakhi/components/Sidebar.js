// // components/Sidebar.js

// "use client";

// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import SakhiStamp from "./SakhiStamp";
// import { useSession } from "../context/SessionContext";

// const NAV_ITEMS = [
//   { href: "/", icon: "🏠", label: "Dashboard" },
//   { href: "/scheme-discovery", icon: "🔍", label: "Scheme Discovery" },
//   { href: "/eligibility", icon: "✅", label: "Eligibility Check" },
//   { href: "/application-support", icon: "📋", label: "Application Support" },
//   { href: "/track-applications", icon: "📈", label: "Track Applications" },
//   { href: "/saved-schemes", icon: "🔖", label: "Saved Schemes" },
//   { href: "/documents", icon: "📎", label: "Uploaded Documents" },
//   { href: "/ai-assistant", icon: "🤖", label: "AI Assistant" },
//   { href: "/languages", icon: "🌐", label: "Languages", badge: "22" },
//   { href: "/feedback", icon: "💬", label: "Feedback" },
//   { href: "/settings", icon: "⚙️", label: "Settings" },
// ];

// export default function Sidebar() {
//   const pathname = usePathname();
//   const router = useRouter();
//   const { user, signOut } = useSession();

//   async function handleLogout() {
//     await signOut();
//     router.push("/login");
//   }

//   return (
//     <aside className="sidebar">
//       <div className="sidebar-brand">
//         <div className="sidebar-logo"><SakhiStamp size={30} /></div>
//         <div className="sidebar-brand-text">
//           <div className="name">YOJANA SAKHI AI</div>
//           <div className="sub">Government of India</div>
//         </div>
//       </div>

//       <nav className="sidebar-nav">
//         {NAV_ITEMS.map((item) => {
//           const active =
//             item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={`nav-item${active ? " active" : ""}`}
//             >
//               <span className="nav-icon">{item.icon}</span>
//               <span>{item.label}</span>
//               {item.badge && <span className="nav-badge">{item.badge}</span>}
//             </Link>
//           );
//         })}
//       </nav>

//       <div className="sidebar-help">
//         <div className="title">Need Help?</div>
//         <div className="desc">
//           Talk to Yojana Sakhi AI, your 24x7 government guide.
//         </div>
//         <Link href="/">
//           <button type="button">Start Conversation →</button>
//         </Link>
//       </div>

//       <div className="sidebar-footer">
//         {user?.email && <div className="sidebar-user">{user.email}</div>}
//         <div className="sidebar-footer-row">
//           <span>© 2026 Yojana Sakhi AI</span>
//           <button type="button" className="sidebar-logout" onClick={handleLogout}>
//             Log out
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// }
// // components/Sidebar.js
// // "use client";

// // import Link from "next/link";
// // import { usePathname, useRouter } from "next/navigation";
// // import {
// //   LayoutDashboard,
// //   Search,
// //   CheckSquare,
// //   FileText,
// //   TrendingUp,
// //   Bookmark,
// //   Paperclip,
// //   Bot,
// //   Globe,
// //   MessageSquare,
// //   Settings,
// // } from "lucide-react";
// // import SakhiStamp from "./SakhiStamp";
// // import { useSession } from "../context/SessionContext";

// // const NAV_ITEMS = [
// //   { href: "/", icon: LayoutDashboard, label: "Dashboard" },
// //   { href: "/scheme-discovery", icon: Search, label: "Scheme Discovery" },
// //   { href: "/eligibility", icon: CheckSquare, label: "Eligibility Check" },
// //   { href: "/application-support", icon: FileText, label: "Application Support" },
// //   { href: "/track-applications", icon: TrendingUp, label: "Track Applications" },
// //   { href: "/saved-schemes", icon: Bookmark, label: "Saved Schemes" },
// //   { href: "/documents", icon: Paperclip, label: "Uploaded Documents" },
// //   { href: "/ai-assistant", icon: Bot, label: "AI Assistant" },
// //   { href: "/languages", icon: Globe, label: "Languages", badge: "22" },
// //   { href: "/feedback", icon: MessageSquare, label: "Feedback" },
// //   { href: "/settings", icon: Settings, label: "Settings" },
// // ];

// // export default function Sidebar() {
// //   const pathname = usePathname();
// //   const router = useRouter();
// //   const { user, signOut } = useSession();

// //   async function handleLogout() {
// //     await signOut();
// //     router.push("/login");
// //   }

// //   return (
// //     <aside className="sidebar">
// //       <div className="sidebar-brand">
// //         <div className="sidebar-logo">
// //           <SakhiStamp size={30} />
// //         </div>
// //         <div className="sidebar-brand-text">
// //           <div className="name">YOJANA SAKHI AI</div>
// //           <div className="sub">Government of India</div>
// //         </div>
// //       </div>

// //       <nav className="sidebar-nav">
// //         {NAV_ITEMS.map((item) => {
// //           const IconComponent = item.icon;
// //           const active =
// //             item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
// //           return (
// //             <Link
// //               key={item.href}
// //               href={item.href}
// //               className={`nav-item${active ? " active" : ""}`}
// //             >
// //               <span className="nav-icon">
// //                 <IconComponent size={18} strokeWidth={2} />
// //               </span>
// //               <span>{item.label}</span>
// //               {item.badge && <span className="nav-badge">{item.badge}</span>}
// //             </Link>
// //           );
// //         })}
// //       </nav>

// //       <div className="sidebar-help">
// //         <div className="title">Need Help?</div>
// //         <div className="desc">
// //           Talk to Yojana Sakhi AI, your 24x7 government guide.
// //         </div>
// //         <Link href="/">
// //           <button type="button">Start Conversation →</button>
// //         </Link>
// //       </div>

// //       <div className="sidebar-footer">
// //         {user?.email && <div className="sidebar-user">{user.email}</div>}
// //         <div className="sidebar-footer-row">
// //           <span>© 2026 Yojana Sakhi AI</span>
// //           <button type="button" className="sidebar-logout" onClick={handleLogout}>
// //             Log out
// //           </button>
// //         </div>
// //       </div>
// //     </aside>
// //   );
// // }
// // components/RightSidebar.js
// // // "use client";

// // // import Link from "next/link";
// // // import {
// // //   CheckSquare,
// // //   TrendingUp,
// // //   FileUp,
// // //   Search,
// // //   ChevronRight,
// // //   Sprout,
// // //   HeartPulse,
// // //   Home,
// // //   Flame,
// // // } from "lucide-react";

// // // const SCHEMES = [
// // //   {
// // //     id: "pm-kisan",
// // //     name: "PM-KISAN Samman Nidhi",
// // //     desc: "₹6,000/year (three instalments of ₹2,000 each)",
// // //     icon: Sprout,
// // //     badge: "Agriculture",
// // //   },
// // //   {
// // //     id: "ayushman-bharat",
// // //     name: "Ayushman Bharat - PMJAY",
// // //     desc: "₹5,000,000 per family/year cashless hospitalisation",
// // //     icon: HeartPulse,
// // //     badge: "Health",
// // //   },
// // //   {
// // //     id: "pm-awas",
// // //     name: "PM Awas Yojana - Gramin",
// // //     desc: "₹1,20,000 (plain) / ₹1,30,000 (hilly areas)",
// // //     icon: Home,
// // //     badge: "Housing",
// // //   },
// // //   {
// // //     id: "pm-ujjwala",
// // //     name: "PM Ujjwala Yojana",
// // //     desc: "Free LPG connection + LPG cylinder subsidy",
// // //     icon: Flame,
// // //     badge: "Energy",
// // //   },
// // // ];

// // // const QUICK_ACTIONS = [
// // //   { label: "Check Eligibility", href: "/eligibility", icon: CheckSquare },
// // //   { label: "Track Application", href: "/track-applications", icon: TrendingUp },
// // //   { label: "Upload Documents", href: "/documents", icon: FileUp },
// // //   { label: "Scheme Discovery", href: "/scheme-discovery", icon: Search },
// // // ];

// // // export default function RightSidebar() {
// // //   return (
// // //     <aside className="dashboard-right-panel">
// // //       {/* Popular Schemes Card */}
// // //       <div className="panel-card">
// // //         <div className="panel-header">
// // //           <h3>Popular Schemes</h3>
// // //         </div>
// // //         <div className="schemes-list">
// // //           {SCHEMES.map((scheme) => {
// // //             const Icon = scheme.icon;
// // //             return (
// // //               <Link
// // //                 key={scheme.id}
// // //                 href={`/scheme-discovery?id=${scheme.id}`}
// // //                 className="scheme-item"
// // //               >
// // //                 <div className="scheme-icon-wrapper">
// // //                   <Icon size={18} />
// // //                 </div>
// // //                 <div className="scheme-info">
// // //                   <div className="scheme-title-row">
// // //                     <span className="scheme-name">{scheme.name}</span>
// // //                   </div>
// // //                   <p className="scheme-desc">{scheme.desc}</p>
// // //                 </div>
// // //                 <ChevronRight size={16} className="chevron-icon" />
// // //               </Link>
// // //             );
// // //           })}
// // //         </div>
// // //       </div>

// // //       {/* Quick Actions Card */}
// // //       <div className="panel-card">
// // //         <div className="panel-header">
// // //           <h3>Quick Actions</h3>
// // //         </div>
// // //         <div className="quick-actions-grid">
// // //           {QUICK_ACTIONS.map((action) => {
// // //             const Icon = action.icon;
// // //             return (
// // //               <Link key={action.label} href={action.href} className="quick-action-btn">
// // //                 <div className="action-left">
// // //                   <div className="action-icon">
// // //                     <Icon size={18} />
// // //                   </div>
// // //                   <span>{action.label}</span>
// // //                 </div>
// // //                 <ChevronRight size={16} className="chevron-icon" />
// // //               </Link>
// // //             );
// // //           })}
// // //         </div>
// // //       </div>
// // //     </aside>
// // //   );
// // // }
// components/Sidebar.js
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  CheckSquare,
  FileText,
  TrendingUp,
  Bookmark,
  Paperclip,
  Bot,
  Globe,
  MessageSquare,
  Settings,
} from "lucide-react";
import SakhiStamp from "./SakhiStamp";
import { useSession } from "../context/SessionContext";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/scheme-discovery", icon: Search, label: "Scheme Discovery" },
  { href: "/eligibility", icon: CheckSquare, label: "Eligibility Check" },
  { href: "/application-support", icon: FileText, label: "Application Support" },
  { href: "/track-applications", icon: TrendingUp, label: "Track Applications" },
  { href: "/saved-schemes", icon: Bookmark, label: "Saved Schemes" },
  { href: "/documents", icon: Paperclip, label: "Uploaded Documents" },
  { href: "/ai-assistant", icon: Bot, label: "AI Assistant" },
  { href: "/languages", icon: Globe, label: "Languages", badge: "22" },
  { href: "/feedback", icon: MessageSquare, label: "Feedback" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useSession();

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <SakhiStamp size={30} />
        </div>
        <div className="sidebar-brand-text">
          <div className="name">YOJANA SAKHI AI</div>
          <div className="sub">Government of India</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? " active" : ""}`}
            >
              <span className="nav-icon">
                <IconComponent size={18} strokeWidth={2} />
              </span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-help">
        <div className="title">Need Help?</div>
        <div className="desc">
          Talk to Yojana Sakhi AI, your 24x7 government guide.
        </div>
        <Link href="/">
          <button type="button">Start Conversation →</button>
        </Link>
      </div>

      <div className="sidebar-footer">
        {user?.email && <div className="sidebar-user">{user.email}</div>}
        <div className="sidebar-footer-row">
          <span>© 2026 Yojana Sakhi AI</span>
          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}