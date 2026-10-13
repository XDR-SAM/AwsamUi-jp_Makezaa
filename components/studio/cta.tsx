import Link from "next/link";
import { SplitText } from "./motion";
import { LeadForm } from "@/components/landing/lead-form";
import { CtaFilm } from "./cta-film";
export function StudioCta({ meeting = true }: { meeting?: boolean }) {
  return (
    <section className="studio-cta" data-nav-theme="light">
      <div className="cta-scene">
        <div className="cta-laptop" aria-hidden="true">
          <CtaFilm />
        </div>
        <div className="cta-title">
          <h2>
            <SplitText text="Let’s get started!" />
          </h2>
          <Link
            href="/contact#contact-form"
            className="glass-pill rolling-link"
          >
            <span data-text="Start a project">Start a project</span>↗
          </Link>
        </div>
      </div>
      {meeting ? (
        <div id="book-meeting" className="studio-booking">
          <div>
            <span className="eyebrow">A good place to start</span>
            <h3>Book a free meeting.</h3>
            <p>
              A 30-minute conversation about your project, timeline, and what
              comes next.
            </p>
          </div>
          <LeadForm type="meeting" compact />
        </div>
      ) : null}
    </section>
  );
}
