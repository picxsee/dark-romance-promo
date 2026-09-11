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

type CreationMode = 'chat' | 'describe' | 'upload';

export default function CharactersPage() {
  const [mode, setMode] = useState<CreationMode>('chat');
  const [name, setName] = useState('');
  const [directPrompt, setDirectPrompt] = useState('');

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
    const saved = localStorage.getItem('novel_characters');

    if (saved) {
      try {
        setCharacters(JSON.parse(saved));
      } catch {
        localStorage.removeItem('novel_characters');
      }
    }
  }, []);

  const saveCharacters = (updated: Character[]) => {
    setCharacters(updated);
    localStorage.setItem('novel_characters', JSON.stringify(updated));
  };

  const changeMode = (nextMode: CreationMode) => {
    setMode(nextMode);
    setError(null);
    setGeneratedImage(null);
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Upload échoué');
    }

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
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Je veux créer un nouveau personnage.',
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error('Impossible de démarrer la conversation.');
      }

      const data = await res.json();

      setChatMessages([
        {
          role: 'user',
          content: 'Je veux créer un nouveau personnage.',
        },
        {
          role: 'assistant',
          content: data.reply || 'Décris-moi ton personnage.',
        },
      ]);
    } catch {
      setError("Impossible de démarrer la conversation avec l'IA.");
      setChatStarted(false);
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const updated: ChatMessage[] = [
      ...chatMessages,
      {
        role: 'user',
        content: chatInput.trim(),
      },
    ];

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

      if (!res.ok) {
        throw new Error('Erreur pendant la conversation.');
      }

      const data = await res.json();

      setChatMessages([
        ...updated,
        {
          role: 'assistant',
          content: data.reply || 'Peux-tu me donner plus de détails ?',
        },
      ]);

      if (data.finalPrompt) {
        setFinalPrompt(data.finalPrompt);
      }
    } catch {
      setError("Erreur pendant la conversation avec l'IA.");
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

    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const file = e.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const generateCharacter = async (
    description: string,
    referenceImageUrl?: string
  ) => {
    const res = await fetch('/api/generate-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        referenceImageUrl,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Génération échouée');
    }

    const data = await res.json();

    if (!data.imageUrl) {
      throw new Error("L'IA n'a pas retourné d'image.");
    }

    setGeneratedImage(data.imageUrl);
  };

  const handleGenerateFromChat = async () => {
    if (!finalPrompt) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      await generateCharacter(finalPrompt);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromDescription = async () => {
    if (!directPrompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      await generateCharacter(directPrompt.trim());
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

      await generateCharacter(
        'Personnage basé sur la photo fournie. Conserver les traits, le visage, la coiffure et l’identité visuelle de la personne.',
        referenceImageUrl
      );
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

      const newCharacter: Character = {
        id: `${Date.now()}`,
        name: name.trim(),
        imageUrl: url,
      };

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
    setDirectPrompt('');
    setChatMessages([]);
    setChatInput('');
    setChatStarted(false);
    setFinalPrompt(null);
    setUploadedFile(null);
    setUploadedPreview(null);
    setGeneratedImage(null);
    setError(null);
  };

  const handleSaveCharacter = () => {
    if (!generatedImage || !name.trim()) return;

    const newCharacter: Character = {
      id: `${Date.now()}`,
      name: name.trim(),
      imageUrl: generatedImage,
    };

    saveCharacters([...characters, newCharacter]);
    resetForm();
  };

  const handleDeleteCharacter = (id: string) => {
    saveCharacters(characters.filter((c) => c.id !== id));
    setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id]
    );
  };

  const handleComposeScene = async () => {
    if (selectedIds.length === 0 || !sceneDescription.trim()) return;

    setComposing(true);
    setComposeError(null);
    setComposedImage(null);

    try {
      const characterImageUrls = characters
        .filter((character) => selectedIds.includes(character.id))
        .map((character) => character.imageUrl);

      const res = await fetch('/api/compose-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterImageUrls,
          sceneDescription,
        }),
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
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <nav className="flex gap-3 mb-10">
          <Link
            href="/generate"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
          >
            1. Résumé
          </Link>

          <span className="px-4 py-2 rounded-full bg-rose-600 text-sm font-semibold">
            2. Personnages
          </span>

          <Link
            href="/video"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
          >
            3. Vidéo
          </Link>
        </nav>

        <h1 className="text-4xl font-bold mb-2">👥 Crée tes personnages</h1>

        <p className="text-purple-200 mb-10">
          Discute avec l’IA, écris ton propre prompt, ou importe directement une photo.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-8">
          <button
            onClick={() => changeMode('chat')}
            className={`py-3 px-2 rounded-xl font-semibold text-xs sm:text-sm transition-colors ${
              mode === 'chat'
                ? 'bg-rose-600'
                : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            💬 Discuter avec l’IA
          </button>

          <button
            onClick={() => changeMode('describe')}
            className={`py-3 px-2 rounded-xl font-semibold text-xs sm:text-sm transition-colors ${
              mode === 'describe'
                ? 'bg-rose-600'
                : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            ✍️ Décrire avec des mots
          </button>

          <button
            onClick={() => changeMode('upload')}
            className={`py-3 px-2 rounded-xl font-semibold text-xs sm:text-sm transition-colors ${
              mode === 'upload'
                ? 'bg-rose-600'
                : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            📸 Importer une photo
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold mb-3">
            Nom du personnage
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Elena Volkov"
            className="w-full rounded-xl bg-white/5 border border-rose-500/20 focus:border-rose-500/60 outline-none p-4 text-white placeholder-white/40 transition-colors"
          />
        </div>

        {mode === 'chat' && (
          <div className="mb-8">
            {!chatStarted ? (
              <button
                onClick={startChat}
                disabled={chatLoading}
                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 transition-colors"
              >
                {chatLoading
                  ? '💬 Connexion avec l’IA...'
                  : '💬 Démarrer la conversation'}
              </button>
            ) : (
              <div className="rounded-xl border border-purple-500/20 bg-white/5 p-4">
                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                          message.role === 'user'
                            ? 'bg-rose-600'
                            : 'bg-white/10'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <p className="text-sm text-white/40">L’IA réfléchit...</p>
                  )}
                </div>

                {!finalPrompt && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          sendChatMessage();
                        }
                      }}
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
                    {loading
                      ? '✨ Génération en cours...'
                      : '✨ Générer le personnage'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'describe' && (
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3">
              Décris son apparence
            </label>

            <textarea
              value={directPrompt}
              onChange={(e) => setDirectPrompt(e.target.value)}
              placeholder="Ex : Femme de 22 ans, longs cheveux bruns presque noirs, yeux vert noisette, teint clair, traits fins, lèvres naturellement rosées. Silhouette élancée et féminine, style élégant et sombre."
              rows={7}
              className="w-full rounded-xl bg-white/5 border border-rose-500/20 focus:border-rose-500/60 outline-none p-4 text-white placeholder-white/40 resize-none transition-colors"
            />

            <p className="text-xs text-white/40 mt-2">
              Ton personnage sera généré comme un portrait photo sur fond gris neutre.
            </p>

            <button
              onClick={handleGenerateFromDescription}
              disabled={loading || !directPrompt.trim()}
              className="w-full mt-4 py-4 rounded-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 disabled:opacity-30 transition-colors"
            >
              {loading
                ? '✨ Génération en cours...'
                : '✨ Générer le personnage'}
            </button>
          </div>
        )}

        {mode === 'upload' && (
          <div className="mb-8">
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

              {uploadedPreview ? (
                <img
                  src={uploadedPreview}
                  alt="Aperçu"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
              ) : (
                <div>
                  <p className="text-3xl mb-3">📁</p>
                  <p className="font-semibold">
                    Glisse une photo ici ou clique pour parcourir
                  </p>
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
                  {loading ? 'Génération...' : 'Styliser avec l’IA'}
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

            <img
              src={generatedImage}
              alt={name || 'Personnage généré'}
              className="max-h-96 mx-auto rounded-lg object-contain mb-4"
            />

            {!name.trim() && (
              <p className="text-yellow-200 text-sm mb-3">
                Ajoute un nom avant de sauvegarder le personnage.
              </p>
            )}

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
            <h3 className="text-xl font-bold mb-2">
              Tes personnages ({characters.length})
            </h3>

            <p className="text-sm text-white/40 mb-4">
              Coche-les pour les inclure dans une affiche ou une scène.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {characters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => toggleSelect(character.id)}
                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer group transition-colors ${
                    selectedIds.includes(character.id)
                      ? 'border-rose-500'
                      : 'border-white/10'
                  }`}
                >
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-full h-40 object-cover"
                  />

                  <div className="p-2 bg-black/40 flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">
                      {character.name}
                    </p>

                    {selectedIds.includes(character.id) && (
                      <span className="text-rose-400">✓</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCharacter(character.id);
                    }}
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
            <h3 className="text-xl font-bold mb-2">
              🖼️ Composer une affiche ou une scène
            </h3>

            <p className="text-sm text-white/50 mb-4">
              {selectedIds.length === 0
                ? 'Sélectionne un ou plusieurs personnages ci-dessus.'
                : `${selectedIds.length} personnage(s) sélectionné(s).`}
            </p>

            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="Ex : Affiche de couverture de livre, les deux personnages face à face dans un manoir gothique sous la pluie, ambiance dramatique."
              rows={4}
              className="w-full rounded-xl bg-white/5 border border-purple-500/20 focus:border-purple-500/60 outline-none p-4 text-white placeholder-white/40 resize-none transition-colors mb-4"
            />

            <button
              onClick={handleComposeScene}
              disabled={
                selectedIds.length === 0 ||
                !sceneDescription.trim() ||
                composing
              }
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-30 transition-colors"
            >
              {composing
                ? '🎨 Composition en cours...'
                : '🎨 Générer la composition'}
            </button>

            {composeError && (
              <p className="text-red-400 text-sm mt-3">{composeError}</p>
            )}

            {composedImage && (
              <div className="mt-6">
                <img
                  src={composedImage}
                  alt="Composition"
                  className="w-full rounded-xl"
                />

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