"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { navLinks, bookMeetingHref, contactHref, siteEmail } from "@/lib/nav-links";

function NavAnchor({
  href,
  className,
  style,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  if (isExternal) {
    return (
      <a href={href} className={className} style={style} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style} onClick={onClick}>
      {children}
    </Link>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to hash after navigating to homepage
  useEffect(() => {
    if (pathname === "/" && window.location.hash) {
      const id = window.location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const closeMobile = () => setIsMobileMenuOpen(false);

  const linkClass = (scrolled: boolean) =>
    `text-sm transition-colors duration-300 relative group ${
      scrolled ? "text-foreground/70 hover:text-foreground" : "text-white/70 hover:text-white"
    }`;

  const underlineClass = (scrolled: boolean) =>
    `absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${
      scrolled ? "bg-foreground" : "bg-white"
    }`;

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          <NavAnchor href="/" className="flex items-center gap-2 group">
            <span
              className={`font-display tracking-tight transition-all duration-500 ${
                isScrolled ? "text-xl text-foreground" : "text-2xl text-white"
              }`}
            >
              MAKEZAA
            </span>
          </NavAnchor>

          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            {navLinks.map((link) => (
              <NavAnchor key={link.name} href={link.href} className={linkClass(isScrolled)}>
                {link.name}
                <span className={underlineClass(isScrolled)} />
              </NavAnchor>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <NavAnchor
              href={contactHref}
              className={`transition-all duration-500 ${
                isScrolled ? "text-xs text-foreground/70 hover:text-foreground" : "text-sm text-white/70 hover:text-white"
              }`}
            >
              Contact
            </NavAnchor>
            <NavAnchor href={bookMeetingHref}>
              <Button
                size="sm"
                className={`rounded-full transition-all duration-500 ${
                  isScrolled
                    ? "bg-foreground hover:bg-foreground/90 text-background px-4 h-8 text-xs"
                    : "bg-white hover:bg-white/90 text-black px-6"
                }`}
              >
                Book meeting
              </Button>
            </NavAnchor>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 transition-colors duration-500 ${
              isScrolled || isMobileMenuOpen ? "text-foreground" : "text-white"
            }`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <div
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-8 overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center gap-6">
            {navLinks.map((link, i) => (
              <NavAnchor
                key={link.name}
                href={link.href}
                onClick={closeMobile}
                className={`text-4xl sm:text-5xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${
                  isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 50}ms` : "0ms" } as React.CSSProperties}
              >
                {link.name}
              </NavAnchor>
            ))}
          </div>

          <div
            className={`flex flex-col gap-3 pt-8 border-t border-foreground/10 transition-all duration-500 ${
              isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <NavAnchor href={`mailto:${siteEmail}`} onClick={closeMobile}>
              <Button variant="outline" className="w-full rounded-full h-14 text-base">
                Email us
              </Button>
            </NavAnchor>
            <NavAnchor href={bookMeetingHref} onClick={closeMobile}>
              <Button className="w-full bg-foreground text-background rounded-full h-14 text-base">
                Book meeting
              </Button>
            </NavAnchor>
          </div>
        </div>
      </div>
    </header>
  );
}
