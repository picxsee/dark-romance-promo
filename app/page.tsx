'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold mb-4 text-center">
          Dark Romance Promo
        </h1>
        <p className="text-xl text-center mb-12 text-rose-200">
          Créez des vidéos promo captivantes pour vos romans
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            href="/generate"
            className="block p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-all hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">🎬 Générer vidéo</h2>
            <p className="text-purple-200">
              Transformez votre résumé en vidéo promo
            </p>
          </Link>

          <Link
            href="/characters"
            className="block p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-rose-500/20 hover:border-rose-500/40 transition-all hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">👥 Personnages</h2>
            <p className="text-rose-200">
              Créez ou importez vos personnages
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
