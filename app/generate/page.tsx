"use client";

import { useState } from "react";
import Link from "next/link";

export default function GeneratePage() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [author, setAuthor] = useState("");

  return (
    <main className="min-h-screen bg-[#120b12] px-5 py-10 text-[#f8edf3] md:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-[#cfa5b9] transition hover:text-white"
        >
          ← Retour à l’accueil
        </Link>

        <header className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#bc617f]">
            Dark Romance Studio
          </p>

          <h1 className="font-serif text-4xl text-white md:text-6xl">
            Crée l’histoire de ton univers.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#d9c5cf] md:text-lg">
            Renseigne les éléments essentiels de ton livre pour préparer une
            ambiance visuelle sombre, intense et captivante pour ta promotion.
          </p>
        </header>

        <section className="rounded-3xl border border-[#553243] bg-[#21121d] p-6 shadow-2xl shadow-black/20 md:p-10">
          <div className="grid gap-6">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#f5dfe8]">
                Titre du livre
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex. Captive de ses ténèbres"
                className="w-full rounded-xl border border-[#654052] bg-[#140b12] px-4 py-3 text-white outline-none placeholder:text-[#92717f] focus:border-[#d4678b]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#f5dfe8]">
                Nom de l’auteur·rice
              </span>
              <input
                type="text"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Ex. Prénom Nom"
                className="w-full rounded-xl border border-[#654052] bg-[#140b12] px-4 py-3 text-white outline-none placeholder:text-[#92717f] focus:border-[#d4678b]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#f5dfe8]">
                Résumé du livre
              </span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Décris l’intrigue, la tension, les secrets, les personnages et l’atmosphère de ton histoire..."
                rows={8}
                className="w-full resize-y rounded-xl border border-[#654052] bg-[#140b12] px-4 py-3 text-white outline-none placeholder:text-[#92717f] focus:border-[#d4678b]"
              />
            </label>

            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-[#b83e66] px-6 py-3 font-semibold text-white transition hover:bg-[#d54d79]"
              >
                Continuer vers les personnages
              </button>

              <Link
                href="/characters"
                className="rounded-xl border border-[#75465b] px-6 py-3 font-semibold text-[#f7dce6] transition hover:bg-[#321825]"
              >
                Voir les personnages
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-6 text-sm text-[#a98494]">
          Titre : {title || "non renseigné"} · Auteur·rice :{" "}
          {author || "non renseigné"}
        </p>
      </div>
    </main>
  );
}