'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type Character = {
  id: string;
  name: string;
  imageUrl: string;
};

export default function CharactersPage() {
  const [mode, setMode] = useState<'describe' | 'upload'>('describe');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('novel_characters');
    if (saved) setCharacters(JSON.parse(saved));
  }, []);

  const saveCharacters = (updated: Character[]) => {
    setCharacters(updated);
    sessionStorage.setItem('novel_characters', JSON.stringify(updated));
  };

  const handleFile = (file: File) => {
    setUploadedFile(file);
    setUploadedPreview(URL.createObjectURL(file));
    setGeneratedImage(null);
    setError(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload échoué');
    const data = await res.json();
    return data.url as string;
  };

  const handleGenerate = async () => {
    if (mode === 'describe' && !description.trim()) return;
    if (mode === 'upload' && !uploadedFile) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let referenceImageUrl: string | undefined;

      if (mode === 'upload' && uploadedFile) {
        referenceImageUrl = await uploadToStorage(uploadedFile);
      }

      const res = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim() || 'personnage de roman dark romance',
          referenceImageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Génération échouée');
      }

      const data = await res.json();
      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCharacter = () => {
    if (!generatedImage || !name.trim()) return;
    const newCharacter: Character = {
      id: `${Date.now()}`,
      name: name.trim(),
      imageUrl: generatedImage,
    };
    saveCharacters([...characters, newCharacter]);
    setName('');
    setDescription('');
    setUploadedFile(null);
    setUploadedPreview(null);
    setGeneratedImage(null);
  };

  const handleUseUploadDirectly = async () => {
    if (!uploadedFile || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const url = await uploadToStorage(uploadedFile);
      const newCharacter: Character = { id: `${Date.now()}`, name: name.trim(), imageUrl: url };
      saveCharacters([...characters, newCharacter]);
      setName('');
      setUploadedFile(null);
      setUploadedPreview(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'import.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCharacter = (id: string) => {
    saveCharacters(characters.filter((c) => c.id !== id));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <nav className="flex gap-3 mb-10">
          <Link href="/generate" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors">
            1. Résumé
          </Link>
          <span className="px-4 py-2 rounded-full bg-rose-600 text-sm font-semibold">2. Personnages</span>
          <Link href="/video" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors">
            3. Vidéo
          </Link>
        </nav>

        <h1 className="text-4xl font-bold mb-2">👥 Crée tes personnages</h1>
        <p className="text-purple-200 mb-10">
          Décris ton personnage avec des mots, ou importe directement une photo.
        </p>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => { setMode('describe'); setError(null); }}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
              mode === 'describe' ? 'bg-rose-600' : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            ✍️ Décrire avec des mots
          </button>
          <button
            onClick={() => { setMode('upload'); setError(null); }}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
              mode === 'upload' ? 'bg-rose-600' : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            📸 Importer une photo
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold mb-3">Nom du personnage</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Damian Volkov"
            className="w-full rounded-xl bg-white/5 border border-rose-500/20 focus:border-rose-500/60 outline-none p-4 text-white placeholder-white/40 transition-colors"
          />
        </div>

        {mode === 'describe' ? (
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3">Décris son apparence</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Homme de 30 ans, cheveux noirs mi-longs, cicatrice sur la joue gauche, regard sombre et intense, costume noir élégant"
              rows={5}
              className="w-full rounded-xl bg-white/5 border border-rose-500/20 focus:border-rose-500/60 outline-none p-4 text-white placeholder-white/40 resize-none transition-colors"
            />
          </div>
        ) : (
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3">Photo du personnage</label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-white/20 hover:border-purple-500/50 bg-white/5 p-6 text-center cursor-pointer transition-colors"
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
              {uploadedPreview ? (
                <img src={uploadedPreview} alt="Aperçu" className="max-h-64 mx-auto rounded-lg object-contain" />
              ) : (
                <div>
                  <p className="text-3xl mb-3">📁</p>
                  <p className="font-semibold">Glisse une photo ici ou clique pour parcourir</p>
                </div>
              )}
            </div>
            {uploadedFile && (
              <button
                onClick={handleUseUploadDirectly}
                disabled={!name.trim() || loading}
                className="mt-4 w-full py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                Utiliser cette photo telle quelle
              </button>
            )}
            <p className="text-sm text-white/40 mt-3 text-center">— ou stylise-la avec l'IA ci-dessous —</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || (mode === 'describe' && !description.trim()) || (mode === 'upload' && !uploadedFile)}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-8 ${
            loading
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500'
          }`}
        >
          {loading ? '✨ Génération en cours...' : '✨ Générer avec l\'IA'}
        </button>

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {generatedImage && (
          <div className="mb-10 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/5 p-6">
            <h3 className="font-bold text-lg mb-4">✨ Ton personnage</h3>
            <img src={generatedImage} alt={name} className="max-h-96 mx-auto rounded-lg object-contain mb-4" />
            <div className="flex gap-3">
              <button
                onClick={handleSaveCharacter}
                disabled={!name.trim()}
                className="flex-1 py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-30 font-semibold text-sm transition-colors"
              >
                ✅ Garder ce personnage
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 font-semibold text-sm transition-colors"
              >
                🔄 Régénérer
              </button>
            </div>
          </div>
        )}

        {characters.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4">Tes personnages ({characters.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {characters.map((c) => (
                <div key={c.id} className="relative rounded-xl overflow-hidden border border-white/10 group">
                  <img src={c.imageUrl} alt={c.name} className="w-full h-40 object-cover" />
                  <div className="p-2 bg-black/40">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCharacter(c.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/video"
          className={`block text-center py-4 rounded-xl font-bold text-lg transition-all ${
            characters.length > 0
              ? 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500'
              : 'bg-white/10 text-white/30 pointer-events-none'
          }`}
        >
          Continuer vers la vidéo →
        </Link>
      </div>
    </main>
  );
}
