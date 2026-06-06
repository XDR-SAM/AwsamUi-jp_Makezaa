"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";

const footerLinks = {
  Services: [
    { name: "WordPress Websites", href: "#features" },
    { name: "Custom Development", href: "#features" },
    { name: "Figma to Code", href: "#features" },
    { name: "Support", href: "#features" },
  ],
  Company: [
    { name: "About", href: "#about" },
    { name: "Projects", href: "#projects" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
  ],
  Resources: [
    { name: "Process", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Tools", href: "#integrations" },
    { name: "Status", href: "#" },
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
  ],
};

const socialLinks = [
  { name: "Twitter", href: "#" },
  { name: "GitHub", href: "#" },
  { name: "LinkedIn", href: "#" },
  { name: "Instagram", href: "#" },
];

export function FooterSection() {
  return (
    <footer className="relative bg-black">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 lg:gap-8">
            <div className="col-span-2">
              <a href="#" className="inline-flex items-center gap-2 mb-6">
                <span className="text-2xl font-display text-white">Makezaa</span>
                <span className="text-xs text-white/40 font-mono">Labs</span>
              </a>

              <p className="text-white/50 leading-relaxed mb-8 max-w-xs text-sm">
                Web development, apps, and digital strategy for growing businesses.
              </p>

              <div className="flex gap-6">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
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
                      <a
                        href={link.href}
                        className="text-sm text-white/40 hover:text-white transition-colors"
                      >
                        {link.name}
                      </a>
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
            <a href="mailto:hello@makezaa.com" className="hover:text-white transition-colors">
              hello@makezaa.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
