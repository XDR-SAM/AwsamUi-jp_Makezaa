"use client";

import { useEffect, useState, useRef } from "react";

const testimonials = [
  {
    quote: "Makezaa delivered our marketing site ahead of schedule, and it actually loads faster than our old one.",
    author: "Rafi Hossain",
    role: "Co-founder",
    company: "LocalFlow",
    metric: { value: "2.1s", label: "Lighthouse perf" },
  },
  {
    quote: "The custom dashboard they shipped for us replaced three spreadsheets. It still runs without issues after months.",
    author: "Nadia Karim",
    role: "Operations Lead",
    company: "DhakaOps",
    metric: { value: "3", label: "Tools replaced" },
  },
  {
    quote: "Responsive, honest, and quick to fix things. Most devs ghost after launch; these guys don't.",
    author: "Tanvir Islam",
    role: "Store Owner",
    company: "CartBridge",
    metric: { value: "0", label: "Days to resolve issues" },
  },
  {
    quote: "We finally have a site that matches our Figma files. Pixel perfect, and still easy to update.",
    author: "Subaona Nowrin",
    role: "Product Designer",
    company: "Studio Nine",
    metric: { value: "100%", label: "Fidelity match" },
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section ref={sectionRef} className="relative py-32 lg:py-40 bg-foreground text-background overflow-hidden">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-20">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-background/40 mb-4">
              <span className="w-12 h-px bg-background/20" />
              Client work
            </span>
            <h2 className={`text-4xl lg:text-5xl font-display transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              Recent work
              <span className="text-background/40">, real outcomes.</span>
            </h2>
          </div>
        </div>

        {/* Main content - Split layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7 relative">
            <span className="absolute -left-4 -top-8 text-[200px] font-display text-background/5 leading-none select-none">
              &ldquo;
            </span>

            <div className="relative">
              <blockquote className="text-3xl lg:text-4xl xl:text-5xl font-display leading-[1.2] tracking-tight">
                {activeTestimonial.quote}
              </blockquote>

              <div className="mt-12 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-background/10 flex items-center justify-center">
                  <span className="font-display text-xl">
                    {activeTestimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium">{activeTestimonial.author}</p>
                  <p className="text-background/60">
                    {activeTestimonial.role}, {activeTestimonial.company}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center gap-6">
            <div className="p-10 border border-background/20 bg-background/5">
              <span className="text-7xl lg:text-8xl font-display block mb-4">
                {activeTestimonial.metric.value}
              </span>
              <span className="text-lg text-background/60">
                {activeTestimonial.metric.label}
              </span>
            </div>

            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className="flex-1 h-1 bg-background/20 overflow-hidden"
                >
                  <div
                    className={`h-full bg-background transition-all duration-300 ${
                      idx === activeIndex ? "w-full" : idx < activeIndex ? "w-full opacity-50" : "w-0"
                    }`}
                    style={idx === activeIndex ? { animation: "progress 8s linear forwards" } : {}}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
