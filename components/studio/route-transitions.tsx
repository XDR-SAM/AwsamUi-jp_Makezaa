"use client";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export function StudioRouteTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const arriving = useRef<{ path: string; resolve: () => void } | null>(null);
  const busy = useRef(false);
  useLayoutEffect(() => {
    const pending = arriving.current;
    if (pending?.path === pathname) {
      arriving.current = null;
      // Painting is suppressed until the update promise resolves; do not wait for a frame.
      pending.resolve();
    }
  }, [pathname]);
  useEffect(() => {
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        url.pathname === pathname ||
        pathname.startsWith("/admin") ||
        url.pathname.startsWith("/admin")
      )
        return;
      document.documentElement.dataset.studioNavigation = "client";
      if (!(
          url.pathname.startsWith("/projects") ||
          pathname.startsWith("/projects")
        ))
        return;
      if (
        !document.startViewTransition ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      event.preventDefault();
      if (busy.current) return;
      busy.current = true;
      const named = [
        ...document.querySelectorAll<HTMLElement>("[data-project-preview]"),
      ];
      named.forEach((image) => {
        image.style.viewTransitionName = "none";
      });
      const selected = url.pathname.startsWith("/projects/")
        ? link.querySelector<HTMLImageElement>("img")
        : null;
      if (selected) selected.style.viewTransitionName = "project-preview";
      document.documentElement.dataset.projectTransition = "active";
      const transition = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const finish = () => {
              clearTimeout(timeout);
              arriving.current = null;
              resolve();
            };
            const timeout = window.setTimeout(finish, 6000);
            arriving.current = {
              path: url.pathname,
              resolve: finish,
            };
            router.push(url.pathname + url.search + url.hash);
          }),
      );
      transition.ready.catch(() => {});
      transition.finished
        .catch(() => {})
        .finally(() => {
          busy.current = false;
          delete document.documentElement.dataset.projectTransition;
          selected?.style.removeProperty("view-transition-name");
          named.forEach((image) =>
            image.style.removeProperty("view-transition-name"),
          );
        });
    };
    document.addEventListener("click", navigate, true);
    return () => document.removeEventListener("click", navigate, true);
  }, [pathname, router]);
  useEffect(() => () => arriving.current?.resolve(), []);
  return children;
}
