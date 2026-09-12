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
  Ce composant contient useSearchParams().
  Il doit être rendu à l’intérieur de Suspense,
  sinon Vercel bloque le build de la page /characters.
*/
function CharactersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<CharacterRole>("heroine");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const [editingId, setEditingId] = useState<string | null>(null);

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

  function resetForm() {
    setName("");
    setDescription("");
    setRole("heroine");
    setImageUrl(undefined);
    setEditingId(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!project) return;

    const character: Character = {
      id: editingId || crypto.randomUUID(),
      name,
      description,
      role,
      imageUrl,
    };

    const updatedProject: Project = editingId
      ? {
          ...project,
          characters: project.characters.map((item) =>
            item.id === editingId ? character : item
          ),
          currentStep: "characters",
        }
      : {
          ...project,
          characters: [...project.characters, character],
          currentStep: "characters",
        };

    saveProject(updatedProject);
    resetForm();
  }

  function handleEdit(character: Character) {
    setName(character.name);
    setDescription(character.description || "");
    setRole(character.role || "heroine");
    setImageUrl(character.imageUrl);
    setEditingId(character.id);
  }

  function handleDelete(characterId: string) {
    if (!project) return;

    const updatedProject: Project = {
      ...project,
      characters: project.characters.filter(
        (character) => character.id !== characterId
      ),
    };

    saveProject(updatedProject);

    if (editingId === characterId) {
      resetForm();
    }
  }

  function goToVideo() {
    if (!project) return;

    router.push(`/video?projectId=${project.id}`);
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
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Personnages</h1>

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

        <form
          onSubmit={handleSubmit}
          className="mb-10 grid gap-6 md:grid-cols-2"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm">Nom</label>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                placeholder="Ex : Elena"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">Rôle</label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as CharacterRole)
                }
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              >
                <option value="heroine">Héroïne</option>
                <option value="hero">Héros</option>
                <option value="villain">Antagoniste</option>
                <option value="side">Secondaire</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm">
                Description ou prompt
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                placeholder="Décris son apparence, son style, son aura…"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm">
                URL image optionnelle
              </label>

              <input
                value={imageUrl || ""}
                onChange={(event) =>
                  setImageUrl(event.target.value || undefined)
                }
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                placeholder="https://…"
              />
            </div>

            {imageUrl && (
              <img
                src={imageUrl}
                alt="Aperçu du personnage"
                className="w-full rounded border border-gray-700"
              />
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-purple-700 px-4 py-2 hover:bg-purple-600"
              >
                {editingId ? "Mettre à jour" : "Ajouter le personnage"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded bg-gray-700 px-4 py-2 hover:bg-gray-600"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </form>

        {project.characters.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold">Tes personnages</h2>

            <div className="grid gap-4 md:grid-cols-3">
              {project.characters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => handleEdit(character)}
                  className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800/40 p-4 transition hover:border-purple-500"
                >
                  {character.imageUrl && (
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      className="mb-3 w-full rounded border border-gray-700"
                    />
                  )}

                  <h3 className="font-semibold">{character.name}</h3>

                  <p className="mb-2 text-xs capitalize text-gray-400">
                    {character.role}
                  </p>

                  <p className="line-clamp-3 text-sm text-gray-300">
                    {character.description}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEdit(character);
                      }}
                      className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(character.id);
                      }}
                      className="rounded bg-red-900/40 px-2 py-1 text-xs hover:bg-red-900/60"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-3">
          <Link
            href={`/generate?projectId=${project.id}`}
            className="rounded bg-gray-700 px-4 py-2 hover:bg-gray-600"
          >
            ← Histoire
          </Link>

          <button
            type="button"
            onClick={goToVideo}
            className="rounded bg-purple-700 px-4 py-2 hover:bg-purple-600"
          >
            Continuer → Vidéos
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CharactersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
          <p>Chargement…</p>
        </div>
      }
    >
      <CharactersContent />
    </Suspense>
  );
}