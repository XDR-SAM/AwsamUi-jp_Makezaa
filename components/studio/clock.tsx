"use client";
import { useEffect, useState } from "react";
export function StudioClock() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Dhaka",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="studio-clock">
      <span>{time || "Dhaka"}</span> <span>(GMT +6)</span>
    </span>
  );
}
