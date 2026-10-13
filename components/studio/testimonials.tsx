import { SplitText } from "./motion";
const testimonials = [
  {
    quote:
      "Makezaa delivered our marketing site ahead of schedule, and it actually loads faster than our old one.",
    author: "Rafi Hossain",
    role: "Co-founder, LocalFlow",
  },
  {
    quote:
      "The custom dashboard they shipped for us replaced three spreadsheets. It still runs without issues after months.",
    author: "Nadia Karim",
    role: "Operations Lead, DhakaOps",
  },
  {
    quote:
      "Responsive, honest, and quick to fix things. Most devs ghost after launch; these guys don’t.",
    author: "Tanvir Islam",
    role: "Store Owner, CartBridge",
  },
  {
    quote:
      "We finally have a site that matches our Figma files. Pixel perfect, and still easy to update.",
    author: "Subaona Nowrin",
    role: "Product Designer, Studio Nine",
  },
];
export function StudioTestimonials() {
  return (
    <section
      className="studio-testimonials studio-section"
      data-nav-theme="light"
    >
      <span className="eyebrow">Client words</span>
      {testimonials.map((item) => (
        <figure className="testimonial-quote" key={item.author}>
          <blockquote>
            <SplitText scrub text={`“${item.quote}”`} />
          </blockquote>
          <figcaption data-reveal>
            — {item.author}
            <span>{item.role}</span>
          </figcaption>
        </figure>
      ))}
    </section>
  );
}
