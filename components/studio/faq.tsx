import Link from "next/link";
import { SplitText } from "./motion";
import { siteEmail } from "@/lib/nav-links";
const questions = [
  [
    "Who is this for?",
    "Founders, growing businesses, and teams who need a website, a commerce store, or a custom digital system that fits the work they do.",
  ],
  [
    "What do you actually help with?",
    "WordPress websites, custom web development, Shopify stores, payments and integrations, SEO and digital marketing, business management and ERP, applied AI, and cloud or AI agent deployment.",
  ],
  [
    "Do you design and build the website?",
    "Both. We work through strategy, design, development, testing, and launch as one team, with a clean handover and practical documentation.",
  ],
  [
    "Can you build something from scratch?",
    "Yes. Bring an idea, a rough brief, or an existing system. We’ll map out the scope and build the website or product around your business.",
  ],
  [
    "How much does it cost?",
    "WordPress websites start at $1,500, custom development at $4,500, and Shopify projects at $3,500. Each service has a clear starting price. We agree on scope and a quote before work begins.",
  ],
  [
    "How do we get started?",
    "Book a free 30-minute meeting or send us a message. We’ll review your goals, timeline, and requirements, then suggest the right next steps.",
  ],
  [
    "How do we work together day to day?",
    "A kickoff to align the scope, regular progress updates, feedback as we build, and a review before launch. You know what’s done and what comes next.",
  ],
  [
    "What happens after launch?",
    "We hand over your website or system with the information needed to manage it. We agree on a support window and can scope ongoing maintenance or improvements.",
  ],
];
export function StudioFaq() {
  return (
    <section
      id="faq"
      className="studio-faq studio-section"
      data-nav-theme="light"
    >
      <div className="section-heading">
        <h2>
          <SplitText text="Questions before" />
          <br />
          <SplitText text="you decide." />
        </h2>
        <a className="glass-pill rolling-link" href={`mailto:${siteEmail}`}>
          <span data-text="Ask a question">Ask a question</span>↗
        </a>
      </div>
      <div className="faq-grid">
        {questions.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <span className="faq-plus" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="faq-answer">
              <p>{answer}</p>
              {question === "How do we get started?" ? (
                <Link href="/contact">Get in touch ↗</Link>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
