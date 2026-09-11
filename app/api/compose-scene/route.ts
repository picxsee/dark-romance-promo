import { fal } from '@fal-ai/client';
import { NextRequest, NextResponse } from 'next/server';

fal.config({ credentials: process.env.FAL_KEY });

export async function POST(req: NextRequest) {
  try {
    const { characterImageUrls, sceneDescription } = await req.json();

    if (!Array.isArray(characterImageUrls) || characterImageUrls.length === 0) {
      return NextResponse.json({ error: 'Au moins un personnage requis' }, { status: 400 });
    }
    if (!sceneDescription || !sceneDescription.trim()) {
      return NextResponse.json({ error: 'Description du décor requise' }, { status: 400 });
    }

    const multiCharacterNote = characterImageUrls.length > 1
      ? `Place ces ${characterImageUrls.length} personnages ensemble dans la même image, en conservant fidèlement l'apparence de chacun. `
      : `Place ce personnage dans le décor suivant, en conservant fidèlement son apparence. `;

    const enhancedPrompt = `${multiCharacterNote}${sceneDescription}. Style affiche de roman dark romance, cinématique, éclairage dramatique, composition soignée digne d'une couverture de livre, haute qualité.`;

    const result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
      input: {
        prompt: enhancedPrompt,
        image_urls: characterImageUrls,
        aspect_ratio: '3:4',
        resolution: '2K',
      },
      logs: false,
    });

    const imageUrl = result.data.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: "L'IA n'a pas retourné d'image" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Compose scene error:', error);
    return NextResponse.json({ error: 'Composition de la scène échouée' }, { status: 500 });
  }
}
