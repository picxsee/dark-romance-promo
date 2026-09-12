"use client";

import { Suspense, useEffect, useState } from "react";
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
  const index = projects.findIndex((project) => project.id === updated.id);

  if (index === -1) {
    return [updated, ...projects];
  }

  const copy = [...projects];

  copy[index] = {
    ...updated,
    updatedAt: Date.now(),
  };

  return copy;
}

/*
  useSearchParams() est utilisé seulement dans ce composant intérieur.
  Le composant exporté à la fin l’enveloppe avec Suspense, nécessaire
  pour que Vercel puisse générer cette page sans erreur.
*/
function VideoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [characterId, setCharacterId] = useState("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const list = loadProjects();
    const currentProject = projectId
      ? list.find((item) => item.id === projectId)
      : list[0];

    if (!currentProject) {
      router.replace("/");
      return;
    }

    setProject(currentProject);

    if (currentProject.characters.length > 0) {
      setCharacterId(currentProject.characters[0].id);
    }

    setLoading(false);
  }, [projectId, router]);

  const saveProject = (updatedProject: Project) => {
    const projects = loadProjects();
    const updatedProjects = updateProject(projects, updatedProject);

    saveProjects(updatedProjects);
    setProject(updatedProject);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!project || !characterId) return;

    const newVideo: Video = {
      id: crypto.randomUUID(),
      characterId,
      prompt,
      createdAt: Date.now(),
    };

    const updatedProject: Project = {
      ...project,
      videos: [...project.videos, newVideo],
      currentStep: "video",
    };

    saveProject(updatedProject);
    setPrompt("");
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <p>Chargement…</p>
      </div>
    );
  }

  const hasCharacters = project.characters.length > 0;

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
          Projet : {project.title || "Sans titre"} • Enregistré automatiquement
        </div>

        {!hasCharacters ? (
          <div className="rounded-lg border border-amber-700/60 bg-amber-950/30 p-5 mb-10">
            <p className="text-amber-100 mb-3">
              Crée au moins un personnage avant de préparer une vidéo.
            </p>

            <Link
              href={`/characters?projectId=${project.id}`}
              className="inline-flex px-4 py-2 rounded bg-purple-700 hover:bg-purple-600 transition"
            >
              Créer un personnage
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mb-10">
            <div>
              <label className="block text-sm mb-1">Personnage</label>

              <select
                value={characterId}
                onChange={(event) => setCharacterId(event.target.value)}
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
              >
                {project.characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Scène / prompt</label>

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
                placeholder="Décris la scène à générer en vidéo…"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-600 transition"
            >
              Créer la vidéo
            </button>
          </form>
        )}

        {project.videos.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Tes vidéos</h2>

            <div className="grid gap-4 md:grid-cols-2">
              {project.videos.map((video) => {
                const character = project.characters.find(
                  (item) => item.id === video.characterId
                );

                return (
                  <div
                    key={video.id}
                    className="p-4 rounded-lg border border-gray-700 bg-gray-800/40"
                  >
                    <div className="text-sm text-gray-400 mb-1">
                      {character?.name || "Personnage supprimé"}
                    </div>

                    <p className="text-sm text-gray-300 mb-2">
                      {video.prompt}
                    </p>

                    {video.videoUrl ? (
                      <video
                        src={video.videoUrl}
                        controls
                        className="w-full rounded border border-gray-700"
                      />
                    ) : (
                      <div className="rounded border border-dashed border-gray-700 p-4 text-xs text-gray-500">
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
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
          >
            ← Personnages
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VideoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
          <p>Chargement…</p>
        </div>
      }
    >
      <VideoPageContent />
    </Suspense>
  );
}