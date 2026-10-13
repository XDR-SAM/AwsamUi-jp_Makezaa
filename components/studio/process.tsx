import { SplitText } from "./motion";
import { AmbientVideo } from "./ambient-video";
import { studioAssets } from "@/lib/studio-assets";
const steps = [
  {
    title: "Strategy & planning",
    text: "We review your goals, audience, and requirements to create a clear roadmap for your website or digital product.",
  },
  {
    title: "Design & development",
    text: "We craft the UI, then build with clean code and modern tooling. Iterate fast, align on feedback.",
  },
  {
    title: "Quality, then launch",
    text: "We test across devices, fix issues, and deploy with care so the launch actually ships without surprises.",
  },
];
export function StudioProcess() {
  return (
    <section
      id="how-it-works"
      className="studio-process studio-section"
      data-nav-theme="light"
    >
      <div className="process-intro">
        <span className="eyebrow">How we work</span>
        <h2>
          <SplitText text="From first idea" />
          <br />
          <SplitText text="to your next chapter." />
        </h2>
        <div className="process-film">
          <AmbientVideo
            src={studioAssets.processFilm}
            poster={studioAssets.projectVisuals[2]}
          />
        </div>
      </div>
      <div className="process-steps">
        {steps.map((step, index) => (
          <article key={step.title} data-reveal>
            <span>[ 0{index + 1} ]</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
      <div id="integrations" className="studio-tooling">
        <span id="infra" className="section-alias" />
        <span className="eyebrow">Tools we use</span>
        <p>
          Next.js / WordPress / Shopify / TypeScript / Figma / Supabase / AWS /
          Vercel / Stripe / Docker / PostgreSQL
        </p>
      </div>
    </section>
  );
}
