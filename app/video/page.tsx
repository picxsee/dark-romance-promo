'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Character = {
  id: string;
  name: string;
  imageUrl: string;
};

export default function VideoPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sceneDescription, setSceneDescription] = useState('');
  const [hasDialogue, setHasDialogue] = useState(false);
  const [dialogue, setDialogue] = useState('');
  const [quality, setQuality] = useState<'rapide' | 'finale'>('finale');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('novel_characters');
    if (saved) {
      const list: Character[] = JSON.parse(saved);
      setCharacters(list);
      if (list.length > 0) setSelectedId(list[0].id);
    }
  }, []);

  const selectedCharacter = characters.find((c) => c.id === selectedId) || null;

  const buildFinalPrompt = (): string => {
    let prompt = sceneDescription.trim();
    if (hasDialogue && dialogue.trim()) {
      prompt += `. Le personnage dit : "${dialogue.trim()}"`;
    }
    prompt += '. Style cinématique sombre et sensuel, éclairage dramatique, ambiance dark romance, mouvement de caméra fluide.';
    return prompt;
  };

  const handleGenerate = async () => {
    if (!selectedCharacter || !sceneDescription.trim()) return;
    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedCharacter.imageUrl,
          scenePrompt: buildFinalPrompt(),
          resolution: quality === 'finale' ? '720p' : '480p',
          duration: 'auto',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Génération vidéo échouée');
      }

      const data = await res.json();
      setVideoUrl(data.videoUrl);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue pendant la génération.');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = selectedCharacter !== null && sceneDescription.trim().length > 0 && !loading;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <nav className="flex gap-3 mb-10">
          <Link href="/generate" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors">
            1. Résumé
          </Link>
          <Link href="/characters" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors">
            2. Personnages
          </Link>
          <span className="px-4 py-2 rounded-full bg-rose-600 text-sm font-semibold">3. Vidéo</span>
        </nav>

        <h1 className="text-4xl font-bold mb-2">🎥 Anime ta scène</h1>
        <p className="text-purple-200 mb-10">
          Choisis un personnage et décris ce qui se passe dans la scène.
        </p>

        {characters.length === 0 ? (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-6 mb-8">
            <p className="text-yellow-200 mb-4">Tu n'as pas encore créé de personnage.</p>
            <Link href="/characters" className="inline-block px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 font-semibold text-sm transition-colors">
              Créer un personnage →
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <label className="block text-lg font-semibold mb-3">1. Quel personnage ?</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`rounded-xl overflow-hidden border-2 transition-colors ${
                      selectedId === c.id ? 'border-rose-500' : 'border-transparent hover:border-white/30'
                    }`}
                  >
                    <img src={c.imageUrl} alt={c.name} className="w-full h-24 object-cover" />
                    <p className="text-xs font-semibold truncate p-1 bg-black/40">{c.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-lg font-semibold mb-3">2. Que se passe-t-il dans la scène ?</label>
              <textarea
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                placeholder="Ex : Il s'approche lentement d'elle dans la bibliothèque abandonnée, la main effleurant son visage, orage au dehors."
                rows={5}
                className="w-full rounded-xl bg-white/5 border border-rose-500/20 focus:border-rose-500/60 outline-none p-4 text-white placeholder-white/40 resize-none transition-colors"
              />
            </div>

            <div className="mb-8">
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDialogue}
                  onChange={(e) => setHasDialogue(e.target.checked)}
                  className="w-5 h-5 accent-rose-600"
                />
                <span className="text-lg font-semibold">3. Le personnage parle-t-il ?</span>
              </label>
              {hasDialogue && (
                <input
                  type="text"
                  value={dialogue}
                  onChange={(e) => setDialogue(e.target.value)}
                  placeholder="Ex : Tu ne pourras jamais m'échapper"
                  className="w-full rounded-xl bg-white/5 border border-rose-500/20 focus:border-rose-500/60 outline-none p-4 text-white placeholder-white/40 transition-colors"
                />
              )}
            </div>

            <div className="mb-8">
              <label className="block text-lg font-semibold mb-3">Qualité</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setQuality('rapide')}
                  className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    quality === 'rapide' ? 'bg-rose-600' : 'bg-white/10 hover:bg-white/20 text-white/70'
                  }`}
                >
                  Aperçu rapide
                </button>
                <button
                  onClick={() => setQuality('finale')}
                  className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    quality === 'finale' ? 'bg-rose-600' : 'bg-white/10 hover:bg-white/20 text-white/70'
                  }`}
                >
                  Qualité promo
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-8 ${
                canGenerate
                  ? 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {loading ? '🎬 Génération en cours (1 à 3 min)...' : '🎬 Générer la vidéo'}
            </button>
          </>
        )}

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {videoUrl && (
          <div className="mb-8 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/5 p-6">
            <h3 className="font-bold text-lg mb-4">✨ Ta vidéo est prête</h3>
            <video src={videoUrl} controls className="w-full rounded-lg" />
            <a
              href={videoUrl}
              download
              className="inline-block mt-4 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 font-semibold text-sm transition-colors"
            >
              ⬇️ Télécharger
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
