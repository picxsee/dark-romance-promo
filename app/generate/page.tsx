'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GeneratePage() {
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [improvedSummary, setImprovedSummary] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);
  const [errorIA, setErrorIA] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('novel_summary');
    if (saved) setSummary(saved);
  }, []);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      setSummary(text.slice(0, 4000));
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

  const handleImproveWithAI = async () => {
    if (!summary.trim()) return;
    setLoadingIA(true);
    setErrorIA(null);
    setImprovedSummary(null);
    try {
      const res = await fetch('/api/improve-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summary }),
      });
      if (!res.ok) throw new Error('Erreur API');
      const data = await res.json();
      setImprovedSummary(data.improved);
    } catch (err) {
      setErrorIA("L'IA n'a pas pu réécrire le texte. Réessaie.");
    } finally {
      setLoadingIA(false);
    }
  };

  const acceptImproved = () => {
    if (improvedSummary) {
      setSummary(improvedSummary);
      setImprovedSummary(null);
      sessionStorage.setItem('novel_summary', improvedSummary);
    }
  };

  const rejectImproved = () => setImprovedSummary(null);

  const saveAndGoTo = (path: string) => {
    sessionStorage.setItem('novel_summary', summary);
    if (fileName) sessionStorage.setItem('novel_file_name', fileName);
    router.push(path);
  };

  const canContinue = summary.trim().length > 0 || fileName !== null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Navigation libre entre étapes */}
        <nav className="flex gap-3 mb-10">
          <span className="px-4 py-2 rounded-full bg-rose-600 text-sm font-semibold">
            1. Résumé
          </span>
          <Link
            href="/characters"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
          >
            2. Personnages
          </Link>
          <Link
            href="/video"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
          >
            3. Vidéo
          </Link>
        </nav>

        <h1 className="text-4xl font-bold mb-2">🎬 L'histoire de ton roman</h1>
        <p className="text-purple-200 mb-10">
          Écris ton résumé, importe un fichier, ou laisse l'IA t'aider — tu peux naviguer librement entre les étapes.
        </p>

        {/* Zone de texte */}
        <div className="mb-4">
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
          <p className="text-sm text-white/40 mt-2">{summary.length} caractères</p>
        </div>

        {/* Bouton IA */}
        <div className="mb-8">
          <button
            onClick={handleImproveWithAI}
            disabled={!summary.trim() || loadingIA}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-colors ${
              !summary.trim() || loadingIA
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500'
            }`}
          >
            {loadingIA ? '✨ Réécriture en cours...' : '✨ Améliorer avec l\'IA (Claude)'}
          </button>
          {errorIA && <p className="text-red-400 text-sm mt-2">{errorIA}</p>}
        </div>

        {/* Validation de la version IA */}
        {improvedSummary && (
          <div className="mb-8 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/5 p-6">
            <h3 className="font-bold text-lg mb-3">✨ Version réécrite par l'IA</h3>
            <p className="text-white/80 whitespace-pre-wrap mb-5">{improvedSummary}</p>
            <div className="flex gap-3">
              <button
                onClick={acceptImproved}
                className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 font-semibold text-sm transition-colors"
              >
                ✅ Valider cette version
              </button>
              <button
                onClick={rejectImproved}
                className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-semibold text-sm transition-colors"
              >
                ✏️ Garder mon texte / corriger
              </button>
            </div>
          </div>
        )}

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
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-rose-500 bg-rose-500/10' : 'border-white/20 hover:border-purple-500/50 bg-white/5'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" onChange={handleFileInput} className="hidden" />
            {fileName ? (
              <div>
                <p className="text-2xl mb-2">✅</p>
                <p className="font-semibold">{fileName}</p>
                <p className="text-sm text-white/50 mt-1">Clique pour changer de fichier</p>
              </div>
            ) : (
              <div>
                <p className="text-3xl mb-3">📁</p>
                <p className="font-semibold">Glisse ton fichier ici ou clique pour parcourir</p>
                <p className="text-sm text-white/50 mt-1">Formats acceptés : .txt, .pdf, .docx</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation libre : accès direct aux personnages, avec ou sans résumé rempli */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => saveAndGoTo('/characters')}
            disabled={!canContinue}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
              canContinue
                ? 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            Continuer vers les personnages →
          </button>
          <button
            onClick={() => router.push('/characters')}
            className="py-4 px-6 rounded-xl font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 transition-colors"
          >
            Passer cette étape
          </button>
        </div>
      </div>
    </main>
  );
}
