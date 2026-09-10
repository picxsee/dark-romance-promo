import { NextRequest, NextResponse } from 'next/server';

// Cette route appelle l'API Claude (Anthropic) pour réécrire le résumé.
// Nécessite la variable d'environnement ANTHROPIC_API_KEY sur Vercel
// (Settings > Environment Variables), jamais exposée au client.

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texte manquant' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Anthropic non configurée sur le serveur' },
        { status: 500 }
      );
    }

    const prompt = `Tu es un rédacteur spécialisé dans la promotion de romans dark romance.
Réécris le résumé suivant pour le rendre plus percutant, immersif et accrocheur,
en gardant l'intrigue, les personnages et le ton dark romance d'origine.
Ne dépasse pas 150 mots. Réponds uniquement avec le résumé réécrit, sans commentaire ni titre.

Résumé original :
${text}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Erreur Claude API: ${errText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const improved = data.content?.[0]?.text?.trim() ?? '';

    return NextResponse.json({ improved });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur lors de la réécriture' },
      { status: 500 }
    );
  }
}
