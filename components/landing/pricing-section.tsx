"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Check, Zap } from "lucide-react";
import { serviceCatalog, formatServicePrice, serviceBillingLabel } from "@/lib/service-catalog";

export function PricingSection() {
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

  return (
    <section id="pricing" ref={sectionRef} className="relative py-32 lg:py-40 scroll-mt-28">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header - Dramatic offset */}
        <div className="grid lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
              <span className="w-12 h-px bg-foreground/30" />
              Pricing
            </span>
            <h2 className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              Simple,
              <br />
              <span className="text-stroke">honest rates.</span>
            </h2>
          </div>

          <div className="lg:col-span-5 lg:self-end">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Clear starting prices for focused projects and ongoing growth. We agree on scope, deliverables, and timeline before work begins.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              All prices are in USD. Advertising spend, platform subscriptions, and cloud usage are quoted separately.
            </p>
          </div>
        </div>

        {/* Service pricing uses the same catalog as the cards below the hero. */}
        <div className="relative">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {serviceCatalog.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative bg-background border flex flex-col transition-all duration-700 ${
                  plan.highlight
                    ? "border-foreground"
                    : "border-foreground/10"
                } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-8 right-8 flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-mono uppercase tracking-widest">
                      <Zap className="w-3 h-3" />
                      Custom Build
                    </span>
                  </div>
                )}

                <div className="p-6 lg:p-8 flex flex-col flex-1">
                  {/* Plan header */}
                  <div className="mb-8 pb-8 border-b border-foreground/10">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-2xl font-display mt-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <p className="text-xs text-muted-foreground font-mono mb-2">Starting from</p>
                    <div className="text-4xl font-display tracking-tight whitespace-nowrap">
                      {formatServicePrice(plan.startingPrice)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      {serviceBillingLabel(plan.billing)}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#eca8d6] mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href="/contact#contact-form"
                    aria-label={`Get a quote for ${plan.name}`}
                    className={`w-full mt-auto py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                      plan.highlight
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                    }`}
                  >
                    Get a quote
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note with icons */}
        <div className={`mt-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pt-12 border-t border-foreground/10 transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Clear scope
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Clean handoff
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Support window
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .text-stroke {
          -webkit-text-stroke: 1.5px currentColor;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </section>
  );
}
