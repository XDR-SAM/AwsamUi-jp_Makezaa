"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { navLinks, siteEmail } from "@/lib/nav-links";

const footerLinks = {
  Services: [
    { name: "WordPress Websites", href: "/#features" },
    { name: "Custom Development", href: "/#features" },
    { name: "Figma to Code", href: "/#features" },
    { name: "AWS & Agents", href: "/#features" },
  ],
  Company: [
    { name: "About", href: "/#about" },
    { name: "Projects", href: "/projects" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ],
  Resources: [
    { name: "Process", href: "/#how-it-works" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Tools", href: "/#integrations" },
    { name: "Book a meeting", href: "/#book-meeting" },
  ],
  Legal: [
    { name: "Privacy", href: "/contact" },
    { name: "Terms", href: "/contact" },
  ],
};

const socialLinks = [
  { name: "Twitter", href: "https://twitter.com" },
  { name: "GitHub", href: "https://github.com" },
  { name: "LinkedIn", href: "https://linkedin.com" },
  { name: "Instagram", href: "https://instagram.com" },
];

export function FooterSection() {
  return (
    <footer id="contact" className="relative bg-black scroll-mt-28">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 lg:gap-8">
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-6">
                <span className="text-2xl font-display text-white">Makezaa</span>
                <span className="text-xs text-white/40 font-mono">Labs</span>
              </Link>

              <p className="text-white/50 leading-relaxed mb-8 max-w-xs text-sm">
                Web development, apps, and digital strategy for growing businesses.
              </p>

              <div className="flex flex-wrap gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium text-white mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/40 hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">
            &copy; 2026 Makezaa. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-white/30">
            <a href={`mailto:${siteEmail}`} className="hover:text-white transition-colors">
              {siteEmail}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
