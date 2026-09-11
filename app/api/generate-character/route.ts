import { fal } from '@fal-ai/client';
import { NextRequest, NextResponse } from 'next/server';

fal.config({ credentials: process.env.FAL_KEY });

export async function POST(req: NextRequest) {
  try {
    const { description, referenceImageUrl } = await req.json();

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description du personnage requise' },
        { status: 400 }
      );
    }

    const enhancedPrompt = `Photo de studio professionnelle sur fond GRIS UNI NEUTRE UNIQUEMENT (comme un fond de studio photo, sans aucun décor, sans architecture, sans meuble, sans bougie, sans arrière-plan narratif). Sujet : ${description}. Contraintes strictes : arrière-plan entièrement gris uni et flou, éclairage studio doux et homogène venant de face, cadrage portrait centré buste ou pied, pose neutre face caméra, aucun élément de décor visible, haute qualité photoréaliste, détails du visage nets. Rappel : le fond DOIT rester un gris uni simple, comme une fiche personnage de casting, pas une scène.`;

    let result;

    if (referenceImageUrl) {
      result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
        input: {
          prompt: enhancedPrompt,
          image_urls: [referenceImageUrl],
          aspect_ratio: '4:5',
          resolution: '1K',
        },
        logs: false,
      });
    } else {
      result = await fal.subscribe('fal-ai/nano-banana-pro', {
        input: {
          prompt: enhancedPrompt,
          aspect_ratio: '4:5',
          resolution: '1K',
        },
        logs: false,
      });
    }

    const imageUrl = result.data.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "L'IA n'a pas retourné d'image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Nano Banana Pro error:', error);
    return NextResponse.json(
      { error: 'Génération du personnage échouée' },
      { status: 500 }
    );
  }
}
