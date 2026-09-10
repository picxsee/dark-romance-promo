'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function VideoPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scenePrompt, setScenePrompt] = useState('');
  const [resolution, setResolution] = useState<'480p' | '720p'>('720p');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImage = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setVideoUrl(null);
    setError(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImage(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload image échoué');
    const data = await res.json();
    return data.url as string;
  };

  const handleGenerate = async () => {
    if (!imageFile || !scenePrompt.trim()) return;
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    try {
      const imageUrl = await uploadImage(imageFile);

      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          scenePrompt,
          resolution,
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
      setError(err.message || "Une erreur est survenue pendant la génération.");
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = imageFile !== null && scenePrompt.trim().length > 0 && !loading;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <nav className="flex gap-3 mb-10">
          <Link
            href="/generate"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
          >
            1. Résumé
          </Link>
          <Link
            href="/characters"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
          >
            2. Personnages
          </Link>
          <span className="px-4 py-2 rounded-full bg-rose-600 text-sm font-semibold">
            3. Vidéo
          </span>
        </nav>

        <h1 className="text-4xl font-bold mb-2">🎥 Anime ta scène</h1>
        <p className="text-purple-200 mb-10">
          Choisis l'image de ton personnage et décris la scène de ton roman à animer.
        </p>

        <div className="mb-8">
          <label className="block text-lg font-semibold mb-3">
            🖼️ Image du personnage
          </label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-white/20 hover:border-purple-500/50 bg-white/5 p-6 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            {imagePreview ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Aperçu du personnage"
                  className="max-h-64 rounded-lg object-contain"
                />
                <p className="text-sm text-white/50">Clique pour changer d'image</p>
              </div>
            ) : (
              <div>
                <p className="text-3xl mb-3">📸</p>
                <p className="font-semibold">Glisse une image ici ou clique pour parcourir</p>
                <p className="text-sm text-white/50 mt-1">Photo ou portrait du personnage</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-lg font-semibold mb-3">
            ✍️ Décris la scène du roman
          </label>
          <textarea
            value={scenePrompt}
            onChange={(e) => setScenePrompt(e.target.value)}
            placeholder="Ex : Il s'approche lentement d'elle dans la bibliothèque abandonnée, la main effleurant son visage. Lumière de bougies vacillante, ombres profondes. Style cinématique sombre. Travelling avant lent."
            rows={6}
            className="w-full rounded-xl bg-white/5 backdrop-blur-sm border border-rose-500/20 focus:border-rose-500/60 outline-none p-4 text-white placeholder-white/40 resize-none transition-colors"
          />
          <p className="text-sm text-white/40 mt-2">{scenePrompt.length} caractères</p>
        </div>

        <div className="mb-8">
          <label className="block text-lg font-semibold mb-3">⚙️ Qualité</label>
          <div className="flex gap-3">
            <button
              onClick={() => setResolution('480p')}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                resolution === '480p'
                  ? 'bg-rose-600'
                  : 'bg-white/10 hover:bg-white/20 text-white/70'
              }`}
            >
              480p (aperçu rapide)
            </button>
            <button
              onClick={() => setResolution('720p')}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                resolution === '720p'
                  ? 'bg-rose-600'
                  : 'bg-white/10 hover:bg-white/20 text-white/70'
              }`}
            >
              720p (qualité promo)
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
          {loading ? '🎬 Génération en cours (peut prendre 1 à 3 min)...' : '🎬 Générer la vidéo'}
        </button>

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
