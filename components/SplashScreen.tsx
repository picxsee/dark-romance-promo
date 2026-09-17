"use client";

import { useEffect, useState } from "react";

const DISPLAY_MS = 1600;
const FADE_MS = 600;

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Petit délai pour déclencher la transition d'entrée (opacity/translate)
    // plutôt qu'un apparition brute au montage.
    const enterTimer = setTimeout(() => setEntered(true), 30);
    const fadeTimer = setTimeout(() => setFading(true), DISPLAY_MS);
    const removeTimer = setTimeout(() => setVisible(false), DISPLAY_MS + FADE_MS);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {children}
      {visible && (
        <div
          aria-hidden={fading}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 transition-opacity duration-500 ${
            fading ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        >
          <div
            className={`transition-all ease-out ${
              entered ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-3"
            }`}
            style={{ transitionDuration: "700ms" }}
          >
            <span className="block text-center text-6xl drop-shadow-[0_0_18px_rgba(244,63,94,0.55)] animate-pulse">
              🩸
            </span>
          </div>

          <h1
            className={`mt-5 text-3xl font-bold tracking-tight text-white transition-all ease-out ${
              entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{ transitionDuration: "700ms", transitionDelay: "150ms" }}
          >
            Dark Romance Promo
          </h1>

          <p
            className={`mt-2 text-sm text-rose-200/70 transition-all ease-out ${
              entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{ transitionDuration: "700ms", transitionDelay: "300ms" }}
          >
            Visuels promo pour tes histoires sombres
          </p>
        </div>
      )}
    </>
  );
}
