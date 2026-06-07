"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LeadForm } from "@/components/landing/lead-form";
import { contactHref } from "@/lib/nav-links";

export function CtaSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div
          className={`relative border border-foreground transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          onMouseMove={handleMouseMove}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(0,0,0,0.15), transparent 40%)`
            }}
          />

          <div id="book-meeting" className="relative z-10 px-8 lg:px-16 py-16 lg:py-24 scroll-mt-28">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
              <div className="flex-1 lg:max-w-md">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display tracking-tight mb-6 leading-[0.95]">
                  Ready to start
                  <br />
                  your next project?
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Book a free 30-minute call. Tell us what you need — we&apos;ll reply with a clear plan and timeline.
                </p>
                <p className="text-sm text-muted-foreground">
                  Prefer email?{' '}
                  <Link href={contactHref} className="text-foreground underline underline-offset-4 hover:opacity-80">
                    Go to contact page
                  </Link>
                </p>
              </div>

              <div className="w-full lg:max-w-md">
                <LeadForm type="meeting" compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
