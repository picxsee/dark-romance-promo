'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type Character = {
  id: string;
  name: string;
  imageUrl: string;
};

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

export default function CharactersPage() {
  const [mode, setMode] = useState<'chat' | 'upload'>('chat');
  const [name, setName] = useState('');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [sceneDescription, setSceneDescription] = useState('');
  const [composedImage, setComposedImage] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('novel_characters');
    if (saved) setCharacters(JSON.parse(saved));
  }, []);

  const saveCharacters = (updated: Character[]) => {
    setCharacters(updated);
    sessionStorage.setItem('novel_characters', JSON.stringify(updated));
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload échoué');
    const data = await res.json();
    return data.url as string;
  };

  const startChat = async () => {
    setChatStarted(true);
    setChatLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/character-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Je veux créer un nouveau personnage.' }] }),
      });
      const data = await res.json();
      setChatMessages([
        { role: 'user', content: 'Je veux créer un nouveau personnage.' },
        { role: 'assistant', content: data.reply },
      ]);
    } catch {
      setError("Impossible de démarrer la conversation avec l'IA.");
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const updated: ChatMessage[] = [...chatMessages, { role: 'user', content: chatInput.trim() }];
    setChatMessages(updated);
    setChatInput('');
    setChatLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/character-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setChatMessages([...updated, { role: 'assistant', content: data.reply }]);
      if (data.finalPrompt) {
        setFinalPrompt(data.finalPrompt);
      }
    } catch {
      setError("Erreur pendant la conversation.");
    } finally {
      setChatLoading(false);
    }
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

  const handleGenerateFromChat = async () => {
    if (!finalPrompt) return;
    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const res = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: finalPrompt }),
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

  const handleGenerateFromUpload = async () => {
    if (!uploadedFile) return;
    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const referenceImageUrl = await uploadToStorage(uploadedFile);
      const res = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'personnage basé sur la photo fournie', referenceImageUrl }),
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

  const handleUseUploadDirectly = async () => {
    if (!uploadedFile || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const url = await uploadToStorage(uploadedFile);
      const newCharacter: Character = { id: `${Date.now()}`, name: name.trim(), imageUrl: url };
      saveCharacters([...characters, newCharacter]);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'import.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setChatMessages([]);
    setChatStarted(false);
    setFinalPrompt(null);
    setUploadedFile(null);
    setUploadedPreview(null);
    setGeneratedImage(null);
  };

  const handleSaveCharacter = () => {
    if (!generatedImage || !name.trim()) return;
    const newCharacter: Character = { id: `${Date.now()}`, name: name.trim(), imageUrl: generatedImage };
    saveCharacters([...characters, newCharacter]);
    resetForm();
  };

  const handleDeleteCharacter = (id: string) => {
    saveCharacters(characters.filter((c) => c.id !== id));
    setSelectedIds(selectedIds.filter((sid) => sid !== id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]));
  };

  const handleComposeScene = async () => {
    if (selectedIds.length === 0 || !sceneDescription.trim()) return;
    setComposing(true);
    setComposeError(null);
    setComposedImage(null);
    try {
      const urls = characters.filter((c) => selectedIds.includes(c.id)).map((c) => c.imageUrl);
      const res = await fetch('/api/compose-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterImageUrls: urls, sceneDescription }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Composition échouée');
      }
      const data = await res.json();
      setComposedImage(data.imageUrl);
    } catch (err: any) {
      setComposeError(err.message || 'Une erreur est survenue.');
    } finally {
      setComposing(false);
    }
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
          Discute avec l'IA pour construire ton personnage, ou importe directement une photo.
        </p>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => { setMode('chat'); setError(null); }}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
              mode === 'chat' ? 'bg-rose-600' : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            💬 Discuter avec l'IA
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

        {mode === 'chat' ? (
          <div className="mb-8">
            {!chatStarted ? (
              <button
                onClick={startChat}
                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-colors"
              >
                💬 Démarrer la conversation
              </button>
            ) : (
              <div className="rounded-xl border border-purple-500/20 bg-white/5 p-4">
                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                        m.role === 'user' ? 'bg-rose-600' : 'bg-white/10'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <p className="text-sm text-white/40">L'IA réfléchit...</p>}
                </div>
                {!finalPrompt && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Ta réponse..."
                      className="flex-1 rounded-lg bg-white/5 border border-white/10 outline-none px-4 py-2 text-white placeholder-white/40"
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-30 font-semibold text-sm transition-colors"
                    >
                      Envoyer
                    </button>
                  </div>
                )}
                {finalPrompt && !generatedImage && (
                  <button
                    onClick={handleGenerateFromChat}
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 font-semibold transition-colors disabled:opacity-50"
                  >
                    {loading ? '✨ Génération en cours...' : '✨ Générer le personnage'}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8">
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
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleUseUploadDirectly}
                  disabled={!name.trim() || loading}
                  className="flex-1 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
                >
                  Utiliser telle quelle
                </button>
                <button
                  onClick={handleGenerateFromUpload}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Génération...' : 'Styliser avec l\'IA'}
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {generatedImage && (
          <div className="mb-10 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/5 p-6">
            <h3 className="font-bold text-lg mb-4">✨ Ton personnage</h3>
            <img src={generatedImage} alt={name} className="max-h-96 mx-auto rounded-lg object-contain mb-4" />
            <button
              onClick={handleSaveCharacter}
              disabled={!name.trim()}
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-30 font-semibold text-sm transition-colors"
            >
              ✅ Garder ce personnage
            </button>
          </div>
        )}

        {characters.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-2">Tes personnages ({characters.length})</h3>
            <p className="text-sm text-white/40 mb-4">Coche-les pour les inclure dans une affiche ou une scène.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {characters.map((c) => (
                <div
                  key={c.id}
                  onClick={() => toggleSelect(c.id)}
                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer group transition-colors ${
                    selectedIds.includes(c.id) ? 'border-rose-500' : 'border-white/10'
                  }`}
                >
                  <img src={c.imageUrl} alt={c.name} className="w-full h-40 object-cover" />
                  <div className="p-2 bg-black/40 flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    {selectedIds.includes(c.id) && <span className="text-rose-400">✓</span>}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(c.id); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {characters.length > 0 && (
          <div className="mb-10 rounded-xl border border-purple-500/20 bg-white/5 p-6">
            <h3 className="text-xl font-bold mb-2">🖼️ Composer une affiche ou une scène</h3>
            <p className="text-sm text-white/50 mb-4">
              {selectedIds.length === 0
                ? 'Sélectionne un ou plusieurs personnages ci-dessus.'
                : `${selectedIds.length} personnage(s) sélectionné(s).`}
            </p>
            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="Ex : Affiche de couverture de livre, les deux personnages face à face dans un manoir gothique sous la pluie, ambiance dramatique"
              rows={4}
              className="w-full rounded-xl bg-white/5 border border-purple-500/20 focus:border-purple-500/60 outline-none p-4 text-white placeholder-white/40 resize-none transition-colors mb-4"
            />
            <button
              onClick={handleComposeScene}
              disabled={selectedIds.length === 0 || !sceneDescription.trim() || composing}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-30 transition-colors"
            >
              {composing ? '🎨 Composition en cours...' : '🎨 Générer la composition'}
            </button>
            {composeError && <p className="text-red-400 text-sm mt-3">{composeError}</p>}
            {composedImage && (
              <div className="mt-6">
                <img src={composedImage} alt="Composition" className="w-full rounded-xl" />
                <a
                  href={composedImage}
                  download
                  className="inline-block mt-4 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 font-semibold text-sm transition-colors"
                >
                  ⬇️ Télécharger
                </a>
              </div>
            )}
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
