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
  useSearchParams() est isolé dans ce composant.
  Le composant exporté tout en bas l'entoure avec Suspense,
  ce qui corrige l'erreur de build Vercel.
*/
function CharactersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<Character["role"]>("heroine");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const [editingId, setEditingId] = useState<string | null>(null);

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
    setLoading(false);
  }, [projectId, router]);

  const saveProject = (updatedProject: Project) => {
    const projects = loadProjects();
    const updatedProjects = updateProject(projects, updatedProject);

    saveProjects(updatedProjects);
    setProject(updatedProject);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setRole("heroine");
    setImageUrl(undefined);
    setEditingId(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
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
  };

  const handleEdit = (character: Character) => {
    setName(character.name);
    setDescription(character.description || "");
    setRole(character.role || "heroine");
    setImageUrl(character.imageUrl);
    setEditingId(character.id);
  };

  const handleDelete = (id: string) => {
    if (!project) return;

    const updatedProject: Project = {
      ...project,
      characters: project.characters.filter((character) => character.id !== id),
    };

    saveProject(updatedProject);

    if (editingId === id) {
      resetForm();
    }
  };

  const goToVideo = () => {
    if (!project) return;

    router.push(`/video?projectId=${project.id}`);
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
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Personnages</h1>

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

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-6 mb-10"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Nom</label>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
                placeholder="Ex : Elena"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Rôle</label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as Character["role"])
                }
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
              >
                <option value="heroine">Héroïne</option>
                <option value="hero">Héros</option>
                <option value="villain">Antagoniste</option>
                <option value="side">Secondaire</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">
                Description ou prompt
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
                placeholder="Décris son apparence, son style, son aura…"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">
                URL image — optionnel
              </label>

              <input
                value={imageUrl || ""}
                onChange={(event) =>
                  setImageUrl(event.target.value || undefined)
                }
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
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
                className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-600 transition"
              >
                {editingId ? "Mettre à jour" : "Ajouter le personnage"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </form>

        {project.characters.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Tes personnages</h2>

            <div className="grid gap-4 md:grid-cols-3">
              {project.characters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => handleEdit(character)}
                  className="p-4 rounded-lg border border-gray-700 bg-gray-800/40 cursor-pointer hover:border-purple-500 transition"
                >
                  {character.imageUrl && (
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      className="w-full rounded mb-3 border border-gray-700"
                    />
                  )}

                  <h3 className="font-semibold">{character.name}</h3>

                  <p className="text-xs text-gray-400 mb-2 capitalize">
                    {character.role}
                  </p>

                  <p className="text-sm text-gray-300 line-clamp-3">
                    {character.description}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEdit(character);
                      }}
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(character.id);
                      }}
                      className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/60"
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
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
          >
            ← Histoire
          </Link>

          <button
            type="button"
            onClick={goToVideo}
            className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-600 transition"
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
          <p>Chargement…</p>
        </div>
      }
    >
      <CharactersPageContent />
    </Suspense>
  );
}