import { SplitText } from "./motion";
const standards = [
  {
    title: "Secure by default",
    description:
      "HTTPS, safe headers, and least-privilege configuration as standard practice.",
  },
  {
    title: "Clean handoffs",
    description:
      "Well-documented code and repo setup so you or another team can continue safely.",
  },
  {
    title: "Accessible delivery",
    description: "Usability and structure checks before launch.",
  },
  {
    title: "Ongoing support",
    description:
      "Post-launch updates and issue response so the site stays reliable.",
  },
];
export function StudioStandards() {
  return (
    <section
      id="security"
      className="studio-standards studio-section"
      data-nav-theme="light"
    >
      <span className="eyebrow">Built with care</span>
      <h2>
        <SplitText text="Good design deserves" />
        <br />
        <SplitText text="a reliable foundation." />
      </h2>
      <div className="standards-grid">
        {standards.map((item, index) => (
          <article key={item.title} data-reveal>
            <span>[ 0{index + 1} ]</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
