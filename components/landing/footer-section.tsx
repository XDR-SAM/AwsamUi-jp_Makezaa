import Link from "next/link";
import { StudioClock } from "@/components/studio/clock";
import { siteEmail } from "@/lib/nav-links";
export function FooterSection() {
  return (
    <footer className="studio-footer" id="contact" data-nav-theme="dark">
      <div className="footer-meta">
        <div>
          <p>Designed & built by Makezaa Studio</p>
          <p>Websites. Systems. Digital experiences.</p>
          <a href={`mailto:${siteEmail}`}>{siteEmail}</a>
        </div>
        <div>
          <p className="footer-label">Index</p>
          <Link href="/">Home</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/blog">Insights</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <p className="footer-label">Explore</p>
          <Link href="/#features">Services</Link>
          <Link href="/#how-it-works">Our process</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#book-meeting">Book a meeting</Link>
        </div>
        <div>
          <p className="footer-label">Socials</p>
          <a href="https://github.com/XDR-SAM" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a href={`mailto:${siteEmail}`}>Email ↗</a>
        </div>
      </div>
      <div className="footer-brand">
        <span>MAKEZAA</span>
      </div>
      <div className="footer-bottom">
        <StudioClock />
        <span>© {new Date().getFullYear()} Makezaa Studio</span>
        <a href="#top" className="rolling-link">
          <span data-text="Back to top ↑">Back to top ↑</span>
        </a>
      </div>
    </footer>
  );
}
