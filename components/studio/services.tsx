"use client";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  serviceCatalog,
  formatServicePrice,
  serviceBillingLabel,
} from "@/lib/service-catalog";
import { studioAssets } from "@/lib/studio-assets";
import { AmbientVideo } from "./ambient-video";
import { SplitText } from "./motion";
const films = [
  studioAssets.serviceWeb,
  studioAssets.processFilm,
  studioAssets.serviceCommerce,
  studioAssets.serviceMotion,
  studioAssets.serviceCommerce,
  studioAssets.processFilm,
  studioAssets.serviceMotion,
  studioAssets.serviceWeb,
];

export function StudioServices() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const sectionElement = root.current;
    if (!sectionElement) return;
    const context = gsap.context(() => {
      gsap.utils
        .toArray<HTMLElement>(".service-anchor")
        .forEach((item, index) =>
          ScrollTrigger.create({
            trigger: item,
            start: "top 45%",
            end: () =>
              `+=${item.nextElementSibling?.getBoundingClientRect().height || window.innerHeight}`,
            onEnter: () => setActive(index),
            onEnterBack: () => setActive(index),
          }),
        );
    }, sectionElement);
    return () => context.revert();
  }, []);
  return (
    <section
      id="features"
      ref={root}
      className="studio-services"
      data-nav-theme="light"
    >
      <span id="pricing" className="anchor-target" />
      {serviceCatalog.map((service, index) => (
        <Fragment key={service.id}>
          <span className="service-anchor" id={`service-${service.id}`} />
          <article className="service-step" style={{ zIndex: index + 1 }}>
            <div className="service-copy">
              <span className="eyebrow">
                Our Services{" "}
                <span>{String(index + 1).padStart(2, "0")} / 08</span>
              </span>
              <h2>
                <SplitText text={service.name} />
              </h2>
              <div className="service-brief">
                <div>
                  <span>Timeline</span>
                  <p>{service.billing === "month" ? "Ongoing" : "Scoped to your project"}</p>
                  <span>Deliverables</span>
                  <p>{service.features.length} core deliverables</p>
                </div>
                <p>{service.description}</p>
              </div>
              <ul className="service-deliverables">
                {service.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div className="service-price">
                <div>
                  <span>
                    Starting from · {serviceBillingLabel(service.billing)}
                  </span>
                  <strong>{formatServicePrice(service.startingPrice)}</strong>
                </div>
                <Link
                  className="glass-pill rolling-link"
                  href={`/contact#contact-form`}
                  aria-label={`Start a ${service.name} project`}
                >
                  <span data-text="Start a project">Start a project</span>↗
                </Link>
              </div>
            </div>
            <div className="service-visual">
              <AmbientVideo
                src={films[index]}
                enabled={index === active}
                poster={films[index] === studioAssets.processFilm
                  ? studioAssets.processFilmPoster
                  : studioAssets.projectVisuals[index % 5]}
              />
              <nav aria-label="Choose a service" className="service-index">
                {serviceCatalog.map((item, i) => (
                  <a
                    key={item.id}
                    href={`#service-${item.id}`}
                    className={i === active ? "is-active" : ""}
                  >
                    {item.name}
                    {i === active ? " —" : ""}
                  </a>
                ))}
              </nav>
            </div>
          </article>
        </Fragment>
      ))}
    </section>
  );
}
