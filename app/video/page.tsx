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
  characterIds: string[];
  prompt: string;
  dialogue?: string;
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
  l'entoure avec Suspense pour que Vercel puisse construire /video.
*/
function VideoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sceneDescription, setSceneDescription] = useState("");
  const [dialogue, setDialogue] = useState("");

  const [composedImage, setComposedImage] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

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
    setLoading(false);
  }, [projectId, router]);

  function saveProject(updatedProject: Project) {
    const projects = loadProjects();

    const updatedProjects = updateProject(projects, updatedProject);

    saveProjects(updatedProjects);
    setProject(updatedProject);
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id]
    );
    setComposedImage(null);
    setComposeError(null);
  };

  const buildFinalPrompt = () => {
    const parts = [sceneDescription.trim()];

    if (dialogue.trim()) {
      parts.push(`Dialogue prononcé par le(s) personnage(s) : "${dialogue.trim()}"`);
    }

    return parts.filter(Boolean).join(". ");
  };

  const handleComposeScene = async () => {
    if (!project || selectedIds.length === 0 || !sceneDescription.trim()) return;

    const selectedCharacters = project.characters.filter((character) =>
      selectedIds.includes(character.id)
    );

    if (selectedCharacters.length === 1) {
      const single = selectedCharacters[0];

      if (!single.imageUrl) {
        setComposeError("Ce personnage n'a pas d'image utilisable.");
        return;
      }

      setComposedImage(single.imageUrl);
      setComposeError(null);
      return;
    }

    setComposing(true);
    setComposeError(null);
    setComposedImage(null);

    try {
      const characterImageUrls = selectedCharacters
        .map((character) => character.imageUrl)
        .filter((url): url is string => Boolean(url));

      if (characterImageUrls.length === 0) {
        throw new Error("Les personnages sélectionnés n'ont pas d'image utilisable.");
      }

      const res = await fetch("/api/compose-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterImageUrls,
          sceneDescription,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Composition échouée");
      }

      const data = await res.json();
      setComposedImage(data.imageUrl);

      const newPoster: Poster = {
        id: crypto.randomUUID(),
        characterIds: [...selectedIds],
        description: sceneDescription,
        imageUrl: data.imageUrl,
        createdAt: Date.now(),
      };

      saveProject({
        ...project,
        posters: [...project.posters, newPoster],
      });
    } catch (err: any) {
      setComposeError(err.message || "Une erreur est survenue.");
    } finally {
      setComposing(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!project || !composedImage) return;

    setVideoLoading(true);
    setVideoError(null);

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: composedImage,
          scenePrompt: buildFinalPrompt(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Génération vidéo échouée");
      }

      const data = await res.json();

      const newVideo: Video = {
        id: crypto.randomUUID(),
        characterIds: [...selectedIds],
        prompt: sceneDescription,
        dialogue: dialogue.trim() || undefined,
        videoUrl: data.videoUrl,
        createdAt: Date.now(),
      };

      saveProject({
        ...project,
        videos: [...project.videos, newVideo],
        currentStep: "video",
      });

      setSceneDescription("");
      setDialogue("");
      setComposedImage(null);
      setSelectedIds([]);
    } catch (err: any) {
      setVideoError(err.message || "Une erreur est survenue.");
    } finally {
      setVideoLoading(false);
    }
  };

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
              Ajoute d'abord un personnage
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
          <div className="mb-10 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Personnages de la scène
              </label>

              <p className="mb-3 text-xs text-gray-400">
                Sélectionne un ou plusieurs personnages. S'il y en a plusieurs, ils
                seront composés ensemble dans la même image avant l'animation.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {project.characters.map((character) => (
                  <div
                    key={character.id}
                    onClick={() => toggleSelect(character.id)}
                    className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedIds.includes(character.id)
                        ? "border-purple-500"
                        : "border-gray-700"
                    }`}
                  >
                    {character.imageUrl && (
                      <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="h-32 w-full object-cover"
                      />
                    )}

                    <div className="flex items-center justify-between bg-black/50 p-2">
                      <p className="truncate text-sm font-semibold">
                        {character.name}
                      </p>

                      {selectedIds.includes(character.id) && (
                        <span className="text-purple-400">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm">Description de la scène</label>

              <textarea
                value={sceneDescription}
                onChange={(event) => {
                  setSceneDescription(event.target.value);
                  setComposedImage(null);
                }}
                rows={4}
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                placeholder="Décris la scène : lieu, ambiance, action des personnages…"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">Dialogue (optionnel)</label>

              <textarea
                value={dialogue}
                onChange={(event) => setDialogue(event.target.value)}
                rows={2}
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                placeholder='Ex : "Je ne te laisserai jamais partir."'
              />

              {(sceneDescription.trim() || dialogue.trim()) && (
                <p className="mt-2 text-xs text-gray-500">
                  Prompt final envoyé à l'IA : « {buildFinalPrompt()} »
                </p>
              )}
            </div>

            <button
              onClick={handleComposeScene}
              disabled={
                selectedIds.length === 0 || !sceneDescription.trim() || composing
              }
              className="w-full rounded bg-gray-700 px-4 py-3 font-semibold hover:bg-gray-600 disabled:opacity-30"
            >
              {composing ? "🎨 Composition en cours..." : "🎨 Composer la scène"}
            </button>

            {composeError && (
              <p className="text-sm text-red-400">{composeError}</p>
            )}

            {composedImage && (
              <div className="rounded-lg border border-purple-500/40 bg-gray-800/40 p-4">
                <img
                  src={composedImage}
                  alt="Scène composée"
                  className="mb-4 w-full rounded"
                />

                <button
                  onClick={handleGenerateVideo}
                  disabled={videoLoading}
                  className="w-full rounded bg-purple-700 px-4 py-3 font-bold hover:bg-purple-600 disabled:opacity-50"
                >
                  {videoLoading ? "🎬 Animation en cours..." : "🎬 Créer la vidéo"}
                </button>

                {videoError && (
                  <p className="mt-2 text-sm text-red-400">{videoError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {project.videos.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Tes vidéos</h2>

            <div className="grid gap-4 md:grid-cols-2">
              {project.videos.map((video) => {
                const names = video.characterIds
                  .map(
                    (id) =>
                      project.characters.find((item) => item.id === id)?.name
                  )
                  .filter(Boolean)
                  .join(" & ");

                return (
                  <div
                    key={video.id}
                    className="rounded-lg border border-gray-700 bg-gray-800/40 p-4"
                  >
                    <div className="mb-1 text-sm text-gray-400">
                      {names || "Personnage(s) inconnu(s)"}
                    </div>

                    <p className="mb-1 text-sm text-gray-300">{video.prompt}</p>

                    {video.dialogue && (
                      <p className="mb-2 text-sm italic text-purple-300">
                        « {video.dialogue} »
                      </p>
                    )}

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
