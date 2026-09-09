"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Job = { type: string; task: { id: string } };

export default function ResultsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const x = localStorage.getItem("dr-jobs");
    if (x) setJobs(JSON.parse(x));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[.22em] text-orchid">04 — Les résultats</p>
      <h1 className="mt-3 text-4xl font-black">Votre univers prend vie.</h1>
      {jobs.length === 0 ? (
        <div className="panel mt-8 p-8">
          <p className="text-white/60">Aucune génération à afficher.</p>
          <Link href="/generate" className="button-primary mt-5">Lancer une génération</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {jobs.map((job, i) => (
            <article key={i} className="panel p-6">
              <div className="flex justify-between">
                <span className="text-orchid">{job.type === "video" ? "Vidéo Seedance 2.5" : "Visuel promo"}</span>
                <span className="text-xs text-white/40">{job.task.id}</span>
              </div>
              <div className="mt-6 flex aspect-[9/12] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 text-center text-sm text-white/45">
                Prototype prêt.<br />Connexion à l'API Seedance à effectuer.
              </div>
            </article>
          ))}
        </div>
      )}
      <Link href="/" className="button-secondary mt-8">Créer un nouveau teaser</Link>
    </main>
  );
}
