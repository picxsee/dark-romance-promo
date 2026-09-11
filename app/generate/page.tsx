"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Project = {
  id: string;
  title: string;
  summary: string;
  genre: string;
  vibe: string;
  instructions: string;
  characters: Character[];
  posters: Poster[];
  videos: Video[];
  currentStep: "summary" | "characters" | "poster" | "video";
  createdAt: number;
  updatedAt: number;
};

type Character = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  role?: "hero" | "heroine" | "villain" | "side";
};

type Poster = {
  id: string;
  characterIds: string[];
  description: string;
  imageUrl: string;
  createdAt: number;
};

type Video = {
  id: string;
  characterId: string;
  prompt: string;
  videoUrl?: string;
  createdAt: number;
};

const STORAGE_KEY = "dark_romance_projects_v1";

function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function updateProject(projects: Project[], updated: Project): Project[] {
  const idx = projects.findIndex((p) => p.id === updated.id);
  if (idx === -1) return [updated, ...projects];
  const copy = [...projects];
  copy[idx] = { ...updated, updatedAt: Date.now() };
  return copy;
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [genre, setGenre] = useState("");
  const [vibe, setVibe] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    const list = loadProjects();
    let p: Project | undefined;
    if (projectId) {
      p = list.find((x) => x.id === projectId);
    } else {
      // s’il n’y a pas de projectId, on prend le dernier projet
      p = list[0];
    }

    if (!p) {
      // aucun projet : on crée un projet vide et on redirige
      const newP: Project = {
        id: crypto.randomUUID(),
        title: "",
        summary: "",
        genre: "",
        vibe: "",
        instructions: "",
        characters: [],
        posters: [],
        videos: [],
        currentStep: "summary",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = updateProject(list, newP);
      saveProjects(updated);
      router.replace(`/generate?projectId=${newP.id}`);
      return;
    }

    setProject(p);
    setTitle(p.title);
    setSummary(p.summary);
    setGenre(p.genre);
    setVibe(p.vibe);
    setInstructions(p.instructions);
    setLoading(false);
  }, [projectId, router]);

  const saveHistory = () => {
    if (!project) return;
    const updated: Project = {
      ...project,
      title,
      summary,
      genre,
      vibe,
      instructions,
      currentStep: "summary",
    };
    const list = loadProjects();
    const newList = updateProject(list, updated);
    saveProjects(newList);
    setProject(updated);
  };

  useEffect(() => {
    if (!project) return;
    const timeout = setTimeout(() => {
      saveHistory();
    }, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, summary, genre, vibe, instructions]);

  const goToCharacters = () => {
    if (!project) return;
    router.push(`/characters?projectId=${project.id}`);
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Histoire</h1>
          <Link
            href="/"
            className="text-sm text-gray-300 hover:text-white underline"
          >
            ← Accueil
          </Link>
        </div>

        <div className="mb-6 text-xs text-gray-400">
          Projet: {project.title || "Sans titre"} • Enregistré automatiquement
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Titre du livre</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
              placeholder="Ex: Les Ombres du Désir"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Résumé</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
              placeholder="Décris ton histoire en quelques phrases…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Genre</label>
              <input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
                placeholder="Ex: Dark Romance, Mafia, Paranormal…"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Ambiance</label>
              <input
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
                placeholder="Ex: Sombre, sensuel, toxique…"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Consignes pour les visuels
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
              placeholder="Ex: style cinématique, couleurs froides, plans serrés…"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={goToCharacters}
            className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-600"
          >
            Continuer → Personnages
          </button>
        </div>
      </div>
    </div>
  );
}