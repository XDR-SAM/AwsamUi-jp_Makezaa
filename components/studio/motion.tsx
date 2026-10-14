"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function StudioMotion({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const element = root.current;
    if (!element) return;
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
    const media = gsap.matchMedia();
    let scroller: Lenis | undefined;
    let tick: ((time: number) => void) | undefined;
    let mounted = true;
    media.add("(prefers-reduced-motion: no-preference)", () => {
      scroller = new Lenis({
        duration: 1.15,
        smoothWheel: true,
        anchors: false,
        prevent: (node) => node.closest("[data-lenis-prevent]") !== null,
      });
      scroller.on("scroll", ScrollTrigger.update);
      const initialTarget =
        location.hash &&
        document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (initialTarget) {
        const flushTop =
          initialTarget.id.startsWith("service-") ||
          initialTarget.id.startsWith("showcase-") ||
          initialTarget.id.startsWith("project-image-") ||
          ["features", "pricing", "showreel"].includes(initialTarget.id);
        scroller.scrollTo(initialTarget, {
          offset: flushTop ? 0 : -100,
          immediate: true,
        });
      } else scroller.scrollTo(0, { immediate: true });
      tick = (time) => scroller?.raf(time * 1000);
      gsap.ticker.add(tick);
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((item) => {
          const letters = item.querySelectorAll(".reveal-char");
          const heroItem = item.closest(".studio-hero") !== null;
          gsap.from(letters.length ? letters : item, {
            yPercent: letters.length ? 110 : 10,
            opacity: 0,
            duration: 1.1,
            stagger: letters.length ? 0.018 : 0,
            ease: "power3.out",
            delay: heroItem && document.documentElement.dataset.studioNavigation !== "client" ? 3.25 : 0,
            scrollTrigger: heroItem
              ? undefined
              : { trigger: item, start: "top 92%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-scrub-text]").forEach((item) => {
          gsap.fromTo(
            item.querySelectorAll(".reveal-char"),
            { color: "#b3b3b3" },
            {
              color: "#111111",
              stagger: 0.03,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top 80%",
                end: "bottom 45%",
                scrub: 0.7,
              },
            },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-counter]").forEach((item) => {
          const state = { value: 0 };
          gsap.to(state, {
            value: Number(item.dataset.counter),
            duration: 2,
            ease: "power3.out",
            onUpdate: () => {
              item.textContent = Math.round(state.value).toLocaleString(
                "en-US",
              );
            },
            scrollTrigger: { trigger: item, start: "top 90%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((item) => {
          gsap.to(item, {
            yPercent: 15,
            ease: "none",
            scrollTrigger: {
              trigger: item.parentElement,
              start: item.closest(".studio-hero") ? "top top" : "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        });
      }, element);
      const instance = scroller;
      const animationTick = tick;
      return () => {
        context.revert();
        gsap.ticker.remove(animationTick);
        instance.destroy();
        if (scroller === instance) {
          scroller = undefined;
          tick = undefined;
        }
      };
    });
    const localAnchor = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        return;
      const link = (event.target as Element).closest(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!link) return;
      const url = new URL(link.href, location.href);
      const id = url.hash.slice(1);
      if (url.origin !== location.origin || url.pathname !== pathname || !id)
        return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", url);
      const flushTop =
        id.startsWith("service-") ||
        id.startsWith("showcase-") ||
        id.startsWith("project-image-") ||
        ["features", "pricing", "top", "showreel"].includes(id);
      if (scroller) scroller.scrollTo(target, { offset: flushTop ? 0 : -100 });
      else target.scrollIntoView({ behavior: "auto", block: "start" });
    };
    document.addEventListener("click", localAnchor, true);
    const refresh = () => {
      if (mounted) ScrollTrigger.refresh();
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(element);
    document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      mounted = false;
      document.removeEventListener("click", localAnchor, true);
      observer.disconnect();
      window.removeEventListener("load", refresh);
      media.revert();
      if (tick) gsap.ticker.remove(tick);
      scroller?.destroy();
    };
  }, [pathname]);
  return (
    <div ref={root} className={`studio-site ${className}`}>
      {children}
    </div>
  );
}

export function SplitText({
  text,
  scrub = false,
  className = "",
}: {
  text: string;
  scrub?: boolean;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <span
      className={`split-text ${className}`}
      data-reveal={scrub ? undefined : ""}
      data-scrub-text={scrub ? "" : undefined}
    >
      <span className="sr-only">{text}</span>
      {words.map((word, index) => (
        <span
          className="reveal-word"
          aria-hidden="true"
          key={`${index}-${word}`}
        >
          {[...word].map((char, i) => (
            <span className="reveal-char" key={i}>
              {char}
            </span>
          ))}
          {index < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </span>
  );
}
