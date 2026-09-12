"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type CharacterRole = "hero" | "heroine" | "villain" | "side";

type Character = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  role?: CharacterRole;
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
  useSearchParams() doit être dans ce composant interne.
  Le composant VideoPage, exporté par défaut plus bas,
  l’entoure avec Suspense pour que Vercel puisse construire /video.
*/
function VideoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [characterId, setCharacterId] = useState("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const projects = loadProjects();

    const selectedProject = projectId
      ? projects.find((item) => item.id === projectId)
      : projects[0];

    if (!selectedProject) {
      router.replace("/");
      return;
    }

    setProject(selectedProject);

    if (selectedProject.characters.length > 0) {
      setCharacterId(selectedProject.characters[0].id);
    }

    setLoading(false);
  }, [projectId, router]);

  function saveProject(updatedProject: Project) {
    const projects = loadProjects();

    const updatedProjects = updateProject(projects, updatedProject);

    saveProjects(updatedProjects);
    setProject(updatedProject);
  }

  function handleSubmit(event: React.FormEvent) {
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
  }

  if (loading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Vidéos</h1>

          <Link
            href="/"
            className="text-sm text-gray-300 underline hover:text-white"
          >
            ← Accueil
          </Link>
        </div>

        <div className="mb-6 text-xs text-gray-400">
          Projet : {project.title || "Sans titre"} • Enregistré automatiquement
        </div>

        {project.characters.length === 0 ? (
          <div className="rounded-lg border border-purple-500/40 bg-gray-800/40 p-6">
            <h2 className="text-xl font-semibold">
              Ajoute d’abord un personnage
            </h2>

            <p className="mt-2 text-sm text-gray-300">
              Tu dois créer au moins un personnage avant de préparer une scène
              vidéo.
            </p>

            <Link
              href={`/characters?projectId=${project.id}`}
              className="mt-4 inline-block rounded bg-purple-700 px-4 py-2 hover:bg-purple-600"
            >
              Créer un personnage
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-10 space-y-4">
            <div>
              <label className="mb-1 block text-sm">Personnage</label>

              <select
                value={characterId}
                onChange={(event) => setCharacterId(event.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              >
                {project.characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm">Scène / prompt</label>

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                placeholder="Décris la scène à générer en vidéo…"
                required
              />
            </div>

            <button
              type="submit"
              className="rounded bg-purple-700 px-4 py-2 hover:bg-purple-600"
            >
              Créer la vidéo
            </button>
          </form>
        )}

        {project.videos.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Tes vidéos</h2>

            <div className="grid gap-4 md:grid-cols-2">
              {project.videos.map((video) => {
                const character = project.characters.find(
                  (item) => item.id === video.characterId
                );

                return (
                  <div
                    key={video.id}
                    className="rounded-lg border border-gray-700 bg-gray-800/40 p-4"
                  >
                    <div className="mb-1 text-sm text-gray-400">
                      {character?.name || "Personnage inconnu"}
                    </div>

                    <p className="mb-2 text-sm text-gray-300">
                      {video.prompt}
                    </p>

                    {video.videoUrl ? (
                      <video
                        src={video.videoUrl}
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
            className="rounded bg-gray-700 px-4 py-2 hover:bg-gray-600"
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
          <p>Chargement…</p>
        </div>
      }
    >
      <VideoContent />
    </Suspense>
  );
}