"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Character = { id: string; name: string; role: string; description: string; image?: string };

export default function CharactersPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"ai" | "photo">("ai");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Héroïne");
  const [description, setDescription] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [image, setImage] = useState<string | undefined>();

  function add() {
    if (!description && mode === "ai") return;
    setCharacters((x) => [...x, { id: crypto.randomUUID(), name: name || `Personnage ${x.length + 1}`, role, description, image }]);
    setName("");
    setDescription("");
    setImage(undefined);
  }

  function upload(file?: File) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setImage(String(r.result));
    r.readAsDataURL(file);
  }

  function next() {
    localStorage.setItem("dr-characters", JSON.stringify(characters));
    router.push("/generate");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[.22em] text-orchid">02 — Les visages</p>
      <h1 className="mt-3 text-4xl font-black">Créez ou importez vos personnages.</h1>
      <div className="mt-9 grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
        <section className="panel p-6">
          <div className="mb-6 grid grid-cols-2 gap-2">
            <button onClick={() => setMode("ai")} className={mode === "ai" ? "button-primary" : "button-secondary"}>Créer avec IA</button>
            <button onClick={() => setMode("photo")} className={mode === "photo" ? "button-primary" : "button-secondary"}>Importer photo</button>
          </div>
          <label className="label">Nom</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sienna Vale" />
          <label className="label mt-5">Rôle</label>
          <select className="field" value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Héroïne</option>
            <option>Héros</option>
            <option>Secondaire</option>
          </select>
          {mode === "ai" ? (
            <>
              <label className="label mt-5">Description visuelle</label>
              <textarea className="field min-h-32" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cheveux bruns, manteau noir, élégance dangereuse..." />
            </>
          ) : (
            <>
              <label className="label mt-5">Photo</label>
              <input className="field" type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
              <label className="label mt-5">Détails</label>
              <textarea className="field min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Style, tenue, attitude..." />
            </>
          )}
          <button onClick={add} className="button-primary mt-6 w-full">Ajouter ce personnage</button>
        </section>
        <section className="panel min-h-96 p-6">
          <div className="flex justify-between">
            <h2 className="text-xl font-black">Votre casting</h2>
            <span className="text-orchid">{characters.length} personnage(s)</span>
          </div>
          {characters.length === 0 ? (
            <p className="mt-12 text-center text-sm text-white/45">Ajoutez vos personnages essentiels.</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {characters.map((c) => (
                <article key={c.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center text-4xl">✦</div>
                  )}
                  <div className="p-4">
                    <b>{c.name}</b>
                    <p className="text-xs text-orchid">{c.role}</p>
                    <p className="mt-2 text-xs text-white/55">{c.description || "Photo importée"}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="mt-8 flex justify-end">
        <button onClick={next} className="button-primary">Passer à la génération →</button>
      </div>
    </main>
  );
}
