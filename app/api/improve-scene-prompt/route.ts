import { NextRequest, NextResponse } from 'next/server';

// Réécrit/enrichit un prompt technique de scène (style, lumière, composition)
// via Claude, pour la génération d'image/vidéo Seedance / Nano Banana.
// Nécessite ANTHROPIC_API_KEY sur Vercel (Settings > Environment Variables).

export async function POST(req: NextRequest) {
  try {
    const { prompt, sceneDescription, universe } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt manquant' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Anthropic non configurée sur le serveur' },
        { status: 500 }
      );
    }

    const instructions = `Tu es directeur artistique pour des visuels promotionnels de romans dark romance (couvertures, teasers vidéo).
On te donne un prompt technique écrit par l'autrice pour piloter une IA de génération d'image/vidéo (Nano Banana / Seedance).
Enrichis ce prompt avec du vocabulaire visuel précis : éclairage, palette de couleurs, composition, ambiance, texture, mouvement de caméra si pertinent.
Reste fidèle à l'intention de l'autrice, ne change pas les personnages ni l'action décrite.
N'ajoute jamais de contenu explicite ou de violence graphique détaillée — reste dans un registre suggestif et cinématographique.
Réponds uniquement avec le prompt enrichi, en anglais technique de génération d'image (mots-clés séparés par des virgules), sans commentaire ni titre. Maximum 80 mots.
${universe ? `\nUnivers visuel souhaité : ${universe}` : ''}${sceneDescription ? `\nContexte de la scène : ${sceneDescription}` : ''}

Prompt original de l'autrice :
${prompt}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: instructions }],
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
      { error: 'Erreur serveur lors de l\'amélioration du prompt' },
      { status: 500 }
    );
  }
}
