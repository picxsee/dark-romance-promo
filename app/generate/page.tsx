'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratePage() {
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      setFileContent(text);
      setSummary(text.slice(0, 2000));
    } else {
      // Pour PDF / DOCX : on stocke juste le fichier, le traitement
      // (extraction du texte) se fera côté serveur/API plus tard.
      setFileContent(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const canContinue = summary.trim().length > 0 || fileName !== null;

  const handleContinue = () => {
    // On sauvegarde le résumé pour les étapes suivantes (personnages, génération)
    sessionStorage.setItem('novel_summary', summary);
    if (fileName) sessionStorage.setItem('novel_file_name', fileName);
    router.push('/characters');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">🎬 Créer ta vidéo promo</h1>
        <p className="text-purple-200 mb-10">
          Étape 1 sur 3 — Donne-nous l'histoire de ton roman
        </p>

        {/* Zone de texte */}
        <div className="mb-8">
          <label className="block text-lg font-semibold mb-3">
            ✍️ Écris ou colle ton résumé / synopsis
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Ex : Elena n'aurait jamais dû franchir la porte de ce manoir. Mais quand Damian, l'héritier maudit des Volkov, pose les yeux sur elle, il est déjà trop tard pour fuir..."
            rows={8}
            className="w-full rounded-xl bg-white/5 backdrop-blur-sm border border-rose-500/20 focus:border-rose-500/60 outline-none p-4 text-white placeholder-white/40 resize-none transition-colors"
          />
          <p className="text-sm text-white/40 mt-2">
            {summary.length} caractères
          </p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/40 text-sm">OU</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Zone d'upload */}
        <div className="mb-10">
          <label className="block text-lg font-semibold mb-3">
            📄 Importe ton manuscrit ou synopsis
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-rose-500 bg-rose-500/10'
                : 'border-white/20 hover:border-purple-500/50 bg-white/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={handleFileInput}
              className="hidden"
            />
            {fileName ? (
              <div>
                <p className="text-2xl mb-2">✅</p>
                <p className="font-semibold">{fileName}</p>
                <p className="text-sm text-white/50 mt-1">
                  Clique pour changer de fichier
                </p>
              </div>
            ) : (
              <div>
                <p className="text-3xl mb-3">📁</p>
                <p className="font-semibold">
                  Glisse ton fichier ici ou clique pour parcourir
                </p>
                <p className="text-sm text-white/50 mt-1">
                  Formats acceptés : .txt, .pdf, .docx
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canContinue
              ? 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 cursor-pointer'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          Continuer vers les personnages →
        </button>
      </div>
    </main>
  );
}
