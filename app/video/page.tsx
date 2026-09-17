"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type AspectRatio = "9:16" | "16:9" | "1:1";
type Resolution = "480p" | "720p" | "1080p";
type Duration = "auto" | "5" | "10" | "15" | "20" | "30";
type Universe = "" | "gothique" | "contemporain" | "fantasy-sombre" | "victorien" | "urbain-moderne";

type Character = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
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
  if (index === -1) return [updated, ...projects];
  const copy = [...projects];
  copy[index] = { ...updated, updatedAt: Date.now() };
  return copy;
}

function VideoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sceneDescription, setSceneDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [duration, setDuration] = useState<Duration>("auto");
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);
  const [universe, setUniverse] = useState<Universe>("");
  const [freePrompt, setFreePrompt] = useState("");
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [improvePromptError, setImprovePromptError] = useState<string | null>(null);
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
    saveProjects(updateProject(projects, updatedProject));
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

  const aspectPrompt: Record<AspectRatio, string> = {
    "9:16": "Vertical 9:16 portrait composition for TikTok, Instagram Reels and BookTok.",
    "16:9": "Cinematic horizontal 16:9 widescreen composition for YouTube.",
    "1:1": "Square 1:1 centered composition for Instagram feed.",
  };

  const universeLabels: Record<Exclude<Universe, "">, string> = {
    gothique: "Univers gothique : manoirs, pierre ancienne, brume, clair de lune.",
    contemporain: "Univers contemporain réaliste, lumière naturelle, décors actuels.",
    "fantasy-sombre": "Univers fantasy sombre : magie, créatures, paysages surnaturels.",
    victorien: "Univers victorien : costumes d'époque, intérieurs cossus, chandelles.",
    "urbain-moderne": "Univers urbain moderne : néons, ville la nuit, ambiance mafia/thriller.",
  };

  // Le prompt avancé (optionnel) vient s'ajouter au texte de scène, sans jamais
  // le remplacer : il donne du vocabulaire visuel technique en plus.
  const fullPrompt = [
    sceneDescription.trim(),
    universe ? universeLabels[universe] : "",
    freePrompt.trim(),
    aspectPrompt[aspectRatio],
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const handleImprovePrompt = async () => {
    if (!freePrompt.trim()) return;
    setImprovingPrompt(true);
    setImprovePromptError(null);
    try {
      const res = await fetch("/api/improve-scene-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: freePrompt,
          sceneDescription,
          universe: universe ? universeLabels[universe] : "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Amélioration du prompt échouée");
      }
      const data = await res.json();
      if (data.improved) setFreePrompt(data.improved);
    } catch (err: any) {
      setImprovePromptError(err.message || "Une erreur est survenue.");
    } finally {
      setImprovingPrompt(false);
    }
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
        body: JSON.stringify({ characterImageUrls, sceneDescription: fullPrompt, aspectRatio }),
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
        description: fullPrompt,
        imageUrl: data.imageUrl,
        createdAt: Date.now(),
      };
      saveProject({ ...project, posters: [...project.posters, newPoster] });
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
          scenePrompt: fullPrompt,
          resolution,
          duration,
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
        prompt: fullPrompt,
        videoUrl: data.videoUrl,
        createdAt: Date.now(),
      };
      saveProject({
        ...project,
        videos: [...project.videos, newVideo],
        currentStep: "video",
      });
      setSceneDescription("");
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
          <Link href="/" className="text-sm text-gray-300 underline hover:text-white">
            ← Accueil
          </Link>
        </div>

        <div className="mb-6 text-xs text-gray-400">
          Projet : {project.title || "Sans titre"} • Enregistré automatiquement
        </div>

        {project.characters.length === 0 ? (
          <div className="rounded-lg border border-purple-500/40 bg-gray-800/40 p-6">
            <h2 className="text-xl font-semibold">Ajoute d'abord un personnage</h2>
            <p className="mt-2 text-sm text-gray-300">
              Tu dois créer au moins un personnage avant de préparer une scène vidéo.
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
              <label className="mb-2 block text-sm font-semibold">Personnages de la scène</label>
              <p className="mb-3 text-xs text-gray-400">
                Clique sur une ou plusieurs photos pour sélectionner les personnages de la scène
                (contour violet + coche ✓ = sélectionné). S'il y en a plusieurs, ils seront
                composés ensemble dans la même image avant l'animation.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {project.characters.map((character) => (
                  <div
                    key={character.id}
                    onClick={() => toggleSelect(character.id)}
                    className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedIds.includes(character.id) ? "border-purple-500" : "border-gray-700"
                    }`}
                  >
                    {character.imageUrl && (
                      <img src={character.imageUrl} alt={character.name} className="h-32 w-full object-cover" />
                    )}
                    <div className="flex items-center justify-between bg-black/50 p-2">
                      <p className="truncate text-sm font-semibold">{character.name}</p>
                      {selectedIds.includes(character.id) && <span className="text-purple-400">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
              {selectedIds.length === 0 && (
                <p className="mt-2 text-sm text-rose-300">
                  ⚠️ Clique sur au moins une photo ci-dessus pour sélectionner un personnage.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm">
                Description de la scène (inclus le dialogue directement dans le texte)
              </label>
              <textarea
                value={sceneDescription}
                onChange={(event) => {
                  setSceneDescription(event.target.value);
                  setComposedImage(null);
                }}
                rows={8}
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                placeholder={'Décris la scène, l\'action, l\'ambiance… et écris le dialogue directement dedans, par ex. :\n— Tu te trompes de bourreau, répond-il d\'une voix basse.'}
              />
              {!sceneDescription.trim() && (
                <p className="mt-2 text-sm text-rose-300">
                  ⚠️ Écris une description de scène ci-dessus pour pouvoir continuer.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <button
                type="button"
                onClick={() => setShowAdvancedPrompt((value) => !value)}
                className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-200"
              >
                <span>🎛️ Prompt avancé (optionnel)</span>
                <span className="text-xs text-gray-400">{showAdvancedPrompt ? "Réduire ▲" : "Déplier ▼"}</span>
              </button>

              {showAdvancedPrompt && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-300">Univers visuel</label>
                    <select
                      value={universe}
                      onChange={(event) => setUniverse(event.target.value as Universe)}
                      className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-2 text-sm text-white sm:w-64"
                    >
                      <option value="">Aucun (style par défaut)</option>
                      <option value="gothique">Gothique</option>
                      <option value="contemporain">Contemporain</option>
                      <option value="fantasy-sombre">Fantasy sombre</option>
                      <option value="victorien">Victorien</option>
                      <option value="urbain-moderne">Urbain moderne</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-300">
                      Prompt technique libre (mots-clés style, lumière, composition…)
                    </label>
                    <textarea
                      value={freePrompt}
                      onChange={(event) => setFreePrompt(event.target.value)}
                      rows={3}
                      placeholder="Ex : cinematic lighting, moody shadows, close-up, rain on window, teal and crimson palette…"
                      className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleImprovePrompt}
                        disabled={!freePrompt.trim() || improvingPrompt}
                        className="rounded bg-fuchsia-700 px-3 py-1.5 text-xs font-semibold hover:bg-fuchsia-600 disabled:opacity-30"
                      >
                        {improvingPrompt ? "✨ Amélioration…" : "✨ Améliorer avec l'IA"}
                      </button>
                      {improvePromptError && (
                        <p className="text-xs text-red-400">{improvePromptError}</p>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Ce texte s'ajoute à ta description de scène, il ne la remplace pas.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-white/5 p-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-gray-300">Format</label>
                <select
                  value={aspectRatio}
                  onChange={(event) => setAspectRatio(event.target.value as AspectRatio)}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-2 text-sm text-white"
                >
                  <option value="9:16">9:16 · Reels</option>
                  <option value="16:9">16:9 · YouTube</option>
                  <option value="1:1">1:1 · Instagram</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-300">Qualité</label>
                <select
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value as Resolution)}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-2 text-sm text-white"
                >
                  <option value="480p">480p · Aperçu</option>
                  <option value="720p">720p · Standard</option>
                  <option value="1080p">1080p · Haute qualité</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-300">Durée</label>
                <select
                  value={duration}
                  onChange={(event) => setDuration(event.target.value as Duration)}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-2 text-sm text-white"
                >
                  <option value="auto">Auto</option>
                  <option value="5">5 secondes</option>
                  <option value="10">10 secondes</option>
                  <option value="15">15 secondes</option>
                  <option value="20">20 secondes</option>
                  <option value="30">30 secondes</option>
                </select>
              </div>
              <p className="col-span-2 self-end pb-2 text-xs text-gray-400 sm:col-span-1">
                Réglages de ta vidéo
              </p>
            </div>

            <button
              onClick={handleComposeScene}
              disabled={selectedIds.length === 0 || !sceneDescription.trim() || composing}
              className="w-full rounded bg-gray-700 px-4 py-3 font-semibold hover:bg-gray-600 disabled:opacity-30"
            >
              {composing
                ? "🎨 Composition en cours..."
                : selectedIds.length === 0 || !sceneDescription.trim()
                ? "🎨 Sélectionne un personnage et écris la scène pour continuer"
                : "🎨 Composer la scène"}
            </button>

            {composeError && <p className="text-sm text-red-400">{composeError}</p>}

            {composedImage && (
              <div className="rounded-lg border border-purple-500/40 bg-gray-800/40 p-4">
                <img src={composedImage} alt="Scène composée" className="mb-4 w-full rounded" />
                <button
                  onClick={handleGenerateVideo}
                  disabled={videoLoading}
                  className="w-full rounded bg-purple-700 px-4 py-3 font-bold hover:bg-purple-600 disabled:opacity-50"
                >
                  {videoLoading ? "🎬 Animation en cours..." : "🎬 Créer la vidéo"}
                </button>
                {videoError && <p className="mt-2 text-sm text-red-400">{videoError}</p>}
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
                  .map((id) => project.characters.find((item) => item.id === id)?.name)
                  .filter(Boolean)
                  .join(" & ");
                return (
                  <div key={video.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
                    <div className="mb-1 text-sm text-gray-400">{names || "Personnage(s) inconnu(s)"}</div>
                    <p className="mb-2 whitespace-pre-wrap text-sm text-gray-300">{video.prompt}</p>
                    {video.videoUrl ? (
                      <video src={video.videoUrl} controls className="w-full rounded border border-gray-700" />
                    ) : (
                      <div className="text-xs text-gray-500">Vidéo à générer…</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-8 flex gap-3">
          <Link href={`/characters?projectId=${project.id}`} className="rounded bg-gray-700 px-4 py-2 hover:bg-gray-600">
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
