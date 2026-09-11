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

export default function CharactersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire personnage
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<Character["role"]>("heroine");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // Édition
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const list = loadProjects();
    let p = projectId ? list.find((x) => x.id === projectId) : list[0];

    if (!p) {
      router.replace("/");
      return;
    }

    setProject(p);
    setLoading(false);
  }, [projectId, router]);

  const saveProject = (updated: Project) => {
    const list = loadProjects();
    const newList = updateProject(list, updated);
    saveProjects(newList);
    setProject(updated);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setRole("heroine");
    setImageUrl(undefined);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    const newChar: Character = {
      id: editingId || crypto.randomUUID(),
      name,
      description,
      role,
      imageUrl,
    };

    let updated: Project;
    if (editingId) {
      updated = {
        ...project,
        characters: project.characters.map((c) =>
          c.id === editingId ? newChar : c
        ),
        currentStep: "characters",
      };
    } else {
      updated = {
        ...project,
        characters: [...project.characters, newChar],
        currentStep: "characters",
      };
    }

    saveProject(updated);
    resetForm();
  };

  const handleEdit = (c: Character) => {
    setName(c.name);
    setDescription(c.description || "");
    setRole(c.role || "heroine");
    setImageUrl(c.imageUrl);
    setEditingId(c.id);
  };

  const handleDelete = (id: string) => {
    if (!project) return;
    const updated = {
      ...project,
      characters: project.characters.filter((c) => c.id !== id),
    };
    saveProject(updated);
    if (editingId === id) resetForm();
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
          Projet: {project.title || "Sans titre"} • Enregistré automatiquement
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Nom</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
                placeholder="Ex: Elena"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Character["role"])}
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
                Description (ou prompt)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
                placeholder="Décris son apparence, son style, son aura…"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">
                URL image (optionnel)
              </label>
              <input
                value={imageUrl || ""}
                onChange={(e) => setImageUrl(e.target.value || undefined)}
                className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
                placeholder="https://…"
              />
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Aperçu"
                className="w-full rounded border border-gray-700"
              />
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-600"
              >
                {editingId ? "Mettre à jour" : "Ajouter le personnage"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Liste */}
        {project.characters.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Tes personnages</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {project.characters.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleEdit(c)}
                  className="p-4 rounded-lg border border-gray-700 bg-gray-800/40 cursor-pointer hover:border-purple-500 transition"
                >
                  {c.imageUrl && (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="w-full rounded mb-3 border border-gray-700"
                    />
                  )}
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs text-gray-400 mb-2 capitalize">
                    {c.role}
                  </p>
                  <p className="text-sm text-gray-300 line-clamp-3">
                    {c.description}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(c);
                      }}
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
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
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            ← Histoire
          </Link>
          <button
            onClick={goToVideo}
            className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-600"
          >
            Continuer → Vidéos
          </button>
        </div>
      </div>
    </div>
  );
}