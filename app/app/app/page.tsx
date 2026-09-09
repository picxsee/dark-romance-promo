"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreatePage() {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [scene, setScene] = useState("");
  const [autoScenario, setAutoScenario] = useState(true);

  function next(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("dr-project", JSON.stringify({ summary, scene, autoScenario }));
    router.push("/characters");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.25em] text-orchid">Le studio des auteures</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.94] md:text-7xl">
            Faites désirer <span className="text-orchid">votre histoire.</span>
          </h1>
          <p className="mt-6 max-w-xl leading-7 text-white/65">
            Transformez une idée, un résumé ou une scène en visuels cinématiques et teasers courts pour vos réseaux sociaux.
          </p>
        </section>

        <form onSubmit={next} className="panel p-6 md:p-8">
          <p className="text-sm font-bold text-orchid">01 — La scène</p>
          <h2 className="mt-2 text-2xl font-black">Posez l'étincelle.</h2>
          <label className="label mt-6">Résumé du livre — optionnel</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="field min-h-28" placeholder="Elle fuit son passé. Il contrôle un empire..." />
          <label className="label mt-5">Idée de scène</label>
          <textarea required value={scene} onChange={(e) => setScene(e.target.value)} className="field min-h-28" placeholder="Une jeune femme entre dans un bar privé. Un homme mystérieux l'observe sous les néons violets..." />
          <label className="mt-5 flex gap-3 text-sm text-white/75">
            <input checked={autoScenario} onChange={(e) => setAutoScenario(e.target.checked)} type="checkbox" className="accent-violet" />
            <span><strong className="text-white">L'IA construit un mini-scénario.</strong><br />Attraction, tension, cliffhanger.</span>
          </label>
          <button className="button-primary mt-6 w-full">Créer mes personnages →</button>
        </form>
      </div>
    </main>
  );
}
