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

export default function VideoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [characterId, setCharacterId] = useState<string>("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const list = loadProjects();
    let p = projectId ? list.find((x) => x.id === projectId) : list[0];

    if (!p) {
      router.replace("/");
      return;
    }

    setProject(p);
    if (p.characters.length > 0) {
      setCharacterId(p.characters[0].id);
    }
    setLoading(false);
  }, [projectId, router]);

  const saveProject = (updated: Project) => {
    const list = loadProjects();
    const newList = updateProject(list, updated);
    saveProjects(newList);
    setProject(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !characterId) return;

    const newVideo: Video = {
      id: crypto.randomUUID(),
      characterId,
      prompt,
      createdAt: Date.now(),
    };

    const updated: Project = {
      ...project,
      videos: [...project.videos, newVideo],
      currentStep: "video",
    };

    saveProject(updated);
    setPrompt("");
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
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Vidéos</h1>
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

        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <div>
            <label className="block text-sm mb-1">Personnage</label>
            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
            >
              {project.characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Scène / prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
              placeholder="Décris la scène à générer en vidéo…"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-600"
          >
            Créer la vidéo
          </button>
        </form>

        {project.videos.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Tes vidéos</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {project.videos.map((v) => {
                const character = project.characters.find(
                  (c) => c.id === v.characterId
                );
                return (
                  <div
                    key={v.id}
                    className="p-4 rounded-lg border border-gray-700 bg-gray-800/40"
                  >
                    <div className="text-sm text-gray-400 mb-1">
                      {character?.name}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{v.prompt}</p>
                    {v.videoUrl ? (
                      <video
                        src={v.videoUrl}
                        controls
                        className="w-full rounded border border-gray-700"
                      />
                    ) : (
                      <div className="text-xs text-gray-500">
                        Vidéo à générer…
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-8 flex gap-3">
          <Link
            href={`/characters?projectId=${project.id}`}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            ← Personnages
          </Link>
        </div>
      </div>
    </div>
  );
}