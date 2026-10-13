import Link from "next/link";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { LeadForm } from "@/components/landing/lead-form";
import { StudioMotion, SplitText } from "@/components/studio/motion";
import { siteEmail } from "@/lib/nav-links";
import { pageMetadata, previewImage } from "@/lib/seo";
export const metadata = pageMetadata(
  "Contact",
  "Get in touch with Makezaa — book a free meeting or send us a message about your project.",
  "/contact",
  previewImage("site", "contact"),
);
export default function ContactPage() {
  return (
    <StudioMotion>
      <main id="top" data-nav-theme="light">
        <Navigation />
        <header className="studio-page-header">
          <span className="eyebrow">Get in touch / Makezaa Studio</span>
          <h1>
            <SplitText text="Let’s make" />
            <br />
            <SplitText text="something great." />
          </h1>
          <p>
            Tell us what you have in mind. We typically reply within one
            business day.
          </p>
        </header>
        <div className="studio-contact-grid">
          <aside className="contact-information">
            <div>
              <h2>Reach us.</h2>
              <a href={`mailto:${siteEmail}`}>{siteEmail} ↗</a>
              <p>
                Dhaka, Bangladesh.
                <br />
                Working with clients worldwide.
              </p>
            </div>
            <div>
              <span className="eyebrow">Studio hours</span>
              <p>
                Monday–Friday
                <br />9 AM–6 PM (GMT +6)
              </p>
            </div>
            <div>
              <span className="eyebrow">A conversation first</span>
              <p>
                Book a free 30-minute intro call to talk about your goals,
                scope, and timeline.
              </p>
              <Link className="glass-pill" href="#book-meeting">
                Book a meeting ↓
              </Link>
            </div>
          </aside>
          <div className="contact-forms">
            <section id="contact-form">
              <h2>Start a conversation.</h2>
              <p>A new project, a quote, a question — we’d love to hear it.</p>
              <LeadForm type="contact" />
            </section>
            <section id="book-meeting">
              <h2>Book a free meeting.</h2>
              <p>
                Pick a date and time that works for you. We’ll confirm by email.
              </p>
              <LeadForm type="meeting" />
            </section>
          </div>
        </div>
        <FooterSection />
      </main>
    </StudioMotion>
  );
}
