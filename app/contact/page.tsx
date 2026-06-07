import Link from 'next/link';
import { Navigation } from '@/components/landing/navigation';
import { FooterSection } from '@/components/landing/footer-section';
import { LeadForm } from '@/components/landing/lead-form';
import { siteEmail } from '@/lib/nav-links';
import { Mail, MapPin, Clock } from 'lucide-react';

export const metadata = {
  title: 'Contact | Makezaa',
  description: 'Get in touch with Makezaa — book a free meeting or send us a message about your project.',
};

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <h1 className="font-display text-4xl md:text-5xl text-foreground tracking-tight">Contact</h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-xl">
              Tell us about your project. We typically reply within one business day.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4">Reach us</h2>
                <ul className="space-y-4">
                  <li>
                    <a
                      href={`mailto:${siteEmail}`}
                      className="flex items-center gap-3 text-foreground hover:text-foreground/80 transition-colors"
                    >
                      <Mail size={18} className="text-muted-foreground shrink-0" />
                      {siteEmail}
                    </a>
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <MapPin size={18} className="shrink-0 mt-0.5" />
                    <span>Dhaka, Bangladesh — serving clients worldwide</span>
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <Clock size={18} className="shrink-0 mt-0.5" />
                    <span>Mon–Fri, 9 AM – 6 PM (GMT+6)</span>
                  </li>
                </ul>
              </div>

              <div className="border border-border rounded-2xl p-5 bg-card/40">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Want a quick intro call instead? Use the meeting form — pick a date and time that works for you.
                </p>
                <Link
                  href="/#book-meeting"
                  className="inline-block mt-3 text-sm text-foreground underline underline-offset-4 hover:opacity-80"
                >
                  Book on homepage →
                </Link>
              </div>
            </div>

            {/* Forms */}
            <div className="lg:col-span-2 space-y-12">
              <section id="book-meeting" className="scroll-mt-28">
                <h2 className="text-2xl font-display text-foreground mb-2">Book a free meeting</h2>
                <p className="text-sm text-muted-foreground mb-6">30-minute call to discuss your project, timeline, and budget.</p>
                <div className="border border-border rounded-2xl p-6 md:p-8 bg-card/40">
                  <LeadForm type="meeting" />
                </div>
              </section>

              <section id="contact-form" className="scroll-mt-28">
                <h2 className="text-2xl font-display text-foreground mb-2">Send a message</h2>
                <p className="text-sm text-muted-foreground mb-6">General inquiries, quotes, or questions — we read every message.</p>
                <div className="border border-border rounded-2xl p-6 md:p-8 bg-card/40">
                  <LeadForm type="contact" />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </main>
  );
}
