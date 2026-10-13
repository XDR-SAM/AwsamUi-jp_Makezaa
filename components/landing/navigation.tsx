"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navLinks, siteEmail } from "@/lib/nav-links";

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(
    pathname !== "/" && !pathname.startsWith("/projects/"),
  );
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => {
      const sections = [
        ...document.querySelectorAll<HTMLElement>("[data-nav-theme]"),
      ];
      const section = sections.reverse().find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= 58 && r.bottom > 58;
      });
      setLight(
        section ? section.dataset.navTheme === "light" : pathname !== "/",
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        !menu.current?.contains(event.target as Node) &&
        !toggle.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <header className={`studio-navigation ${light ? "nav-light" : "nav-dark"}`}>
      <Link
        href="/"
        className="glass-pill studio-wordmark"
        aria-label="Makezaa home"
        onClick={() => setOpen(false)}
      >
        MAKEZAA
      </Link>
      <div className="navigation-center">
        <button
          ref={toggle}
          className={`glass-pill menu-toggle ${open ? "is-open" : ""}`}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="studio-menu"
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
        </button>
        <div
          ref={menu}
          id="studio-menu"
          className={`glass-menu ${open ? "is-open" : ""}`}
          inert={!open}
        >
          <nav aria-label="Main navigation">
            <Link href="/" onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link href="/projects" onClick={() => setOpen(false)}>
              Projects
            </Link>
            <Link href="/blog" onClick={() => setOpen(false)}>
              Insights
            </Link>
            <div className="menu-sections">
              {navLinks
                .filter((l) => l.href.startsWith("/#"))
                .map((l) => (
                  <Link
                    key={l.name}
                    href={l.href}
                    onClick={() => setOpen(false)}
                  >
                    {l.name}
                  </Link>
                ))}
            </div>
            <div className="menu-socials">
              <a
                href="https://github.com/XDR-SAM"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a href={`mailto:${siteEmail}`}>Email</a>
              <Link href="/contact#book-meeting" onClick={() => setOpen(false)}>
                Book a meeting
              </Link>
            </div>
          </nav>
        </div>
      </div>
      <Link
        className="glass-pill nav-contact rolling-link"
        aria-label="Get in touch"
        href="/contact"
        onClick={() => setOpen(false)}
      >
        <span data-text="Get in touch">Get in touch</span>
      </Link>
    </header>
  );
}
