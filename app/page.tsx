"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function createEmptyProject(): Project {
  const now = Date.now();
  return {
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
    createdAt: now,
    updatedAt: now,
  };
}

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const list = loadProjects();
    setProjects(list);
    setLoading(false);
  }, []);

  const handleNewProject = () => {
    const newProject = createEmptyProject();
    const updated = [newProject, ...projects];
    setProjects(updated);
    saveProjects(updated);
    // On redirige vers l’étape résumé avec l’ID du projet
    router.push(`/generate?projectId=${newProject.id}`);
  };

  const handleContinueProject = (project: Project) => {
    const stepMap: Record<Project["currentStep"], string> = {
      summary: "generate",
      characters: "characters",
      poster: "generate", // on peut choisir une page dedicated poster plus tard
      video: "video",
    };
    const page = stepMap[project.currentStep] || "generate";
    router.push(`/${page}?projectId=${project.id}`);
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveProjects(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <p>Chargement…</p>
      </div>
    );
  }

  const latestProject = projects[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Dark Romance Promo</h1>
        <p className="text-gray-300 mb-8">
          Crée des visuels vidéo pour promouvoir tes livres de dark romance.
        </p>

        {/* Continuer / Nouveau projet */}
        <div className="grid gap-4 md:grid-cols-2 mb-10">
          <button
            onClick={() => latestProject && handleContinueProject(latestProject)}
            disabled={!latestProject}
            className={`p-6 rounded-xl border text-left transition
              ${latestProject ? "border-purple-400 bg-purple-900/30 hover:bg-purple-900/50 cursor-pointer" : "border-gray-700 bg-gray-800/40 opacity-50 cursor-not-allowed"}`}
          >
            <h2 className="text-xl font-semibold mb-1">Continuer mon projet</h2>
            <p className="text-sm text-gray-300">
              {latestProject
                ? latestProject.title || "Projet sans titre"
                : "Aucun projet pour le moment"}
            </p>
          </button>

          <button
            onClick={handleNewProject}
            className="p-6 rounded-xl border border-purple-400 bg-purple-700/30 hover:bg-purple-700/50 text-left transition"
          >
            <h2 className="text-xl font-semibold mb-1">Nouveau projet</h2>
            <p className="text-sm text-gray-300">
              Commencer une nouvelle histoire
            </p>
          </button>
        </div>

        {/* Liste des projets */}
        {projects.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Mes projets</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-lg border border-gray-700 bg-gray-800/40"
                >
                  <h3 className="font-semibold mb-1">
                    {p.title || "Projet sans titre"}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {p.summary || "Aucun résumé"}
                  </p>
                  <div className="flex gap-2 text-xs text-gray-400 mb-3">
                    <span>{p.characters.length} perso</span>
                    <span>•</span>
                    <span>{p.posters.length} affiches</span>
                    <span>•</span>
                    <span>{p.videos.length} vidéos</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleContinueProject(p)}
                      className="px-3 py-1.5 text-sm rounded bg-purple-700/50 hover:bg-purple-700"
                    >
                      Reprendre
                    </button>
                    <Link
                      href={`/generate?projectId=${p.id}`}
                      className="px-3 py-1.5 text-sm rounded bg-gray-700/50 hover:bg-gray-700"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="px-3 py-1.5 text-sm rounded bg-red-900/40 hover:bg-red-900/60"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}