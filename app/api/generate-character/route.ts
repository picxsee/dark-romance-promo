import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const description = body.description;
    const referenceImageUrl = body.referenceImageUrl;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description du personnage requise" },
        { status: 400 }
      );
    }

    const prompt = [
      "Portrait photo réaliste haut de gamme d'un personnage de dark romance.",
      "Photo de studio professionnelle en qualité 2K.",
      "Fond gris neutre uni de studio, propre et discret.",
      "Aucun décor, aucune architecture, aucun meuble, aucune bougie, aucun objet en arrière-plan.",
      "Cadrage vertical de type fiche personnage, format portrait 4:5.",
      "Visage et épaules très nets, regard expressif, peau et textures naturelles.",
      "Éclairage studio doux, cinématique et flatteur.",
      "Style réaliste, élégant, sombre et sensuel, sans texte ni logo.",
      "Description du personnage :",
      description.trim(),
    ].join(" ");

    const model = referenceImageUrl
      ? "fal-ai/nano-banana-pro/edit"
      : "fal-ai/nano-banana-pro";

    const result = referenceImageUrl
      ? await fal.subscribe(model, {
          input: {
            prompt,
            image_urls: [referenceImageUrl],
            resolution: "2K",
            aspect_ratio: "4:5",
          },
          logs: false,
        })
      : await fal.subscribe(model, {
          input: {
            prompt,
            resolution: "2K",
            aspect_ratio: "4:5",
          },
          logs: false,
        });

    const imageUrl = result.data?.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "L'IA n'a pas retourné d'image." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageUrl,
    });
  } catch (error) {
    console.error("Nano Banana Pro error:", error);

    return NextResponse.json(
      { error: "La génération du personnage a échoué." },
      { status: 500 }
    );
  }
}