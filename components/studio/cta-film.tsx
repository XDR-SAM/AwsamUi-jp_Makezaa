"use client";
import { useEffect, useState } from "react";
import { AmbientVideo } from "./ambient-video";
import { studioAssets } from "@/lib/studio-assets";

export function CtaFilm() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 809px)");
    const update = () => setPhone(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <AmbientVideo
      src={phone ? studioAssets.footerFilm : studioAssets.processFilm}
    />
  );
}
