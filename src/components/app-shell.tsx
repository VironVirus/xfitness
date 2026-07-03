"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarDays, Dumbbell, Home, LogOut, Menu, Settings, Shield, UserRound, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useAuth } from "@/context/auth-context";

const PRIMARY_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/book", label: "Book", icon: CalendarDays },
  { href: "/community", label: "Community", icon: Users },
  { href: "/dashboard", label: "Dashboard", icon: Activity }
];

const AUTH_PAGES = new Set(["/login", "/signup"]);

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { member, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [introRevealStarted, setIntroRevealStarted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    const playVideo = async () => {
      try {
        await video?.play();
      } catch {
        return;
      }
    };

    if (video) {
      video.loop = true;
      video.muted = true;
      video.defaultMuted = true;
      void playVideo();
    }

    const revealTimer = window.setTimeout(() => {
      setIntroRevealStarted(true);
    }, 3_000);

    const completeTimer = window.setTimeout(() => {
      setIntroComplete(true);
      videoRef.current?.pause();
    }, 7_000);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const memberName = member?.fullName.split(" ")[0] ?? "Guest";
  const authHref = member ? "/dashboard" : "/login";
  const showBottomNav = !AUTH_PAGES.has(pathname);
  const drawerItems = useMemo(() => {
    const baseItems = [...PRIMARY_NAV, { href: "/settings", label: "Settings", icon: Settings }];

    if (member?.authRole === "gym_owner") {
      baseItems.push({ href: "/admin", label: "Admin", icon: Shield });
    }

    return baseItems;
  }, [member?.authRole]);

  return (
    <>
      <div
        className={`intro-overlay${introRevealStarted ? " intro-overlay-reveal" : ""}${introComplete ? " intro-overlay-hidden" : ""}`}
        aria-hidden={introComplete}
      >
        <video
          ref={videoRef}
          className="intro-video"
          src="/media/opening-video.mp4"
          poster="/media/hero-intro.webp"
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
        />
        <div className="intro-scrim" />
        <div className="intro-brand">
          <span className="brand-badge">XF</span>
          <span className="brand-text">Xfitness</span>
        </div>
        <div className="intro-progress" />
      </div>

      <div className={`app-frame${introRevealStarted ? " app-frame-preload" : ""}${introComplete ? " app-frame-ready" : ""}`}>
        <header className="app-header">
          <div className="app-header-inner">
            <Link href="/" className="brand-link">
              <span className="brand-badge">XF</span>
              <span className="brand-wordmark">
                Xfitness
                <small>Simple training</small>
              </span>
            </Link>

            <nav className="top-nav" aria-label="Primary navigation">
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`top-nav-link${isActivePath(pathname, item.href) ? " top-nav-link-active" : ""}`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="header-actions">
              <ThemeSwitcher />
              <Link href={authHref} className="button button-secondary compact-button header-user-button">
                <UserRound size={16} />
                <span>{memberName}</span>
              </Link>
              <button
                type="button"
                className="icon-button menu-button"
                aria-expanded={menuOpen}
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="app-main">{children}</main>

        {showBottomNav ? (
          <nav className="bottom-nav" aria-label="Bottom navigation">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`bottom-nav-link${isActivePath(pathname, item.href) ? " bottom-nav-link-active" : ""}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>

      <div className={`drawer-backdrop${menuOpen ? " drawer-backdrop-visible" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`drawer-panel${menuOpen ? " drawer-panel-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="drawer-header">
          <div>
            <strong>{member ? member.fullName : "Welcome"}</strong>
            <span>{member ? member.email : "Sign in to save progress"}</span>
          </div>
          <button type="button" className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-section">
          {drawerItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`drawer-link${isActivePath(pathname, item.href) ? " drawer-link-active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="drawer-section">
          <ThemeSwitcher />
          {member ? (
            <button
              type="button"
              className="button button-secondary full-width-button"
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          ) : (
            <Link href="/signup" className="button button-primary full-width-button">
              Join now
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
