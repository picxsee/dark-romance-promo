"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Project = { summary?: string; scene: string };
type Character = { name: string; role: string; description?: string };

export default function GeneratePage() {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [kind, setKind] = useState("both");
  const [ratio, setRatio] = useState("9:16");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem("dr-project"), c = localStorage.getItem("dr-characters");
    if (p) setProject(JSON.parse(p));
    if (c) setCharacters(JSON.parse(c));
  }, []);

  const prompt = useMemo(() => project ? [
    project.summary ? `Book context: ${project.summary}` : "",
    `Scene: ${project.scene}`,
    `Characters: ${characters.map(c => `${c.role} ${c.name}: ${c.description || "reference image"}`).join("; ") || "two adult fictional characters"}`,
    "Visual direction: premium dark romance book promotion, adults only, cinematic storytelling, nocturnal scene, black shadows, violet neon highlights, dramatic backlight, elegant editorial fashion, subtle film grain, emotional eye contact.",
    `Aspect ratio: ${ratio}.`,
    "Avoid: explicit nudity, sexual acts, minors, visible text, logos."
  ].filter(Boolean).join("\n\n") : "", [project, characters, ratio]);

  function generate() {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("dr-jobs", JSON.stringify([{ type: kind, task: { id: "demo-task-1" } }]));
      router.push("/results");
    }, 800);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[.22em] text-orchid">03 — La direction</p>
      <h1 className="mt-3 text-4xl font-black">Choisissez le format du désir.</h1>
      {!project ? (
        <p className="mt-8 text-white/60">Commencez par décrire une scène.</p>
      ) : (
        <div className="mt-9 grid gap-7 lg:grid-cols-2">
          <section className="panel p-6">
            <p className="label">Votre scène</p>
            <p className="text-lg">{project.scene}</p>
            <p className="label mt-6">Sortie</p>
            <div className="grid grid-cols-3 gap-2">
              {["image", "video", "both"].map(v => (
                <button key={v} onClick={() => setKind(v)} className={kind === v ? "button-primary" : "button-secondary"}>
                  {v === "both" ? "Les deux" : v === "image" ? "Image" : "Vidéo"}
                </button>
              ))}
            </div>
            <p className="label mt-6">Format</p>
            <div className="grid grid-cols-3 gap-2">
              {["9:16", "4:5", "1:1"].map(v => (
                <button key={v} onClick={() => setRatio(v)} className={ratio === v ? "button-primary" : "button-secondary"}>{v}</button>
              ))}
            </div>
            <button disabled={loading} onClick={generate} className="button-primary mt-8 w-full">
              {loading ? "Génération..." : "Générer mon teaser"}
            </button>
          </section>
          <section className="panel p-6">
            <p className="label">Prompt de réalisation</p>
            <pre className="whitespace-pre-wrap break-words rounded-2xl bg-black/35 p-5 text-sm leading-6 text-white/65">{prompt}</pre>
          </section>
        </div>
      )}
    </main>
  );
}
