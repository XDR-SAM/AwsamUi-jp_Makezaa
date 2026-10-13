import sanitizeHtml from "sanitize-html";
import type { Project } from "./types";
import { renderCmsContent } from "./cms-rendering";
import { studioAssets } from "./studio-assets";

export function projectGallery(project: Project) {
  const images = [
    {
      src: project.cover_image || studioAssets.projectVisuals[0],
      alt: project.title,
    },
  ];
  if (project.content)
    sanitizeHtml(renderCmsContent(project.content), {
      allowedTags: ["img"],
      allowedAttributes: { img: ["src", "alt"] },
      transformTags: {
        img: (tagName, attribs) => {
          const src = attribs.src;
          if (
            src &&
            /^(https?:\/\/|\/(?!\/))/.test(src) &&
            !images.some((image) => image.src === src)
          )
            images.push({
              src,
              alt: attribs.alt || `${project.title} preview`,
            });
          return { tagName, attribs };
        },
      },
    });
  return images;
}
