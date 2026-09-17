import { fal } from '@fal-ai/client';
import { NextRequest, NextResponse } from 'next/server';

fal.config({ credentials: process.env.FAL_KEY });

export async function POST(req: NextRequest) {
  try {
    const { characterImageUrls, sceneDescription, aspectRatio } = await req.json();

    if (!Array.isArray(characterImageUrls) || characterImageUrls.length === 0) {
      return NextResponse.json({ error: 'Au moins un personnage requis' }, { status: 400 });
    }
    if (!sceneDescription || !sceneDescription.trim()) {
      return NextResponse.json({ error: 'Description du décor requise' }, { status: 400 });
    }

    const multiCharacterNote = characterImageUrls.length > 1
      ? `Place ces ${characterImageUrls.length} personnages ensemble dans la même image, en conservant fidèlement le visage, les traits et l'identité visuelle exacte de chacun, comme sur les photos fournies. `
      : `Place ce personnage dans le décor suivant, en conservant fidèlement son visage, ses traits et son identité visuelle exacte, comme sur la photo fournie. `;

    // Même exigence de photoréalisme que pour la génération de personnage :
    // sans ces instructions explicites, le modèle a tendance à sortir un rendu
    // plus illustratif/stylisé ("affiche") que photo réaliste.
    const enhancedPrompt = [
      multiCharacterNote,
      sceneDescription,
      "Photographie hyperréaliste, prise de vue cinéma numérique, peau et textures naturelles, grain de peau visible, pas de rendu illustré ni peint ni 3D.",
      "Éclairage cinématique réaliste et cohérent avec la scène, profondeur de champ naturelle, composition digne d'une photo de plateau pour promo de roman dark romance.",
      "Ultra détaillé, haute fidélité, aucune déformation du visage.",
    ].join(" ");

    // Le ratio de l'image composée doit correspondre au format vidéo choisi,
    // sinon Seedance reçoit une image dans un cadrage différent de la vidéo demandée.
    const allowedRatios = ['9:16', '16:9', '1:1'];
    const finalAspectRatio = allowedRatios.includes(aspectRatio) ? aspectRatio : '3:4';

    const result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
      input: {
        prompt: enhancedPrompt,
        image_urls: characterImageUrls,
        aspect_ratio: finalAspectRatio,
        resolution: '2K',
      },
      logs: false,
    });

    const imageUrl = result.data.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: "L'IA n'a pas retourné d'image" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Compose scene error:', error);
    const detail =
      error?.body?.detail || error?.message || 'Erreur inconnue côté générateur d\'image.';
    return NextResponse.json(
      { error: `Composition de la scène échouée : ${detail}` },
      { status: 500 }
    );
  }
}
