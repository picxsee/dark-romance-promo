import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const imageUrl = body.imageUrl;
    const scenePrompt = body.scenePrompt;
    const endImageUrl = body.endImageUrl;
    const resolution = body.resolution || "720p";
    const duration = body.duration || "auto";

    if (!imageUrl || !scenePrompt) {
      return NextResponse.json(
        { error: "Image et description de la scène requises" },
        { status: 400 }
      );
    }

    const result = await fal.subscribe(
      "bytedance/seedance-2.5/image-to-video",
      {
        input: {
          image_url: imageUrl,
          prompt: scenePrompt,
          end_image_url: endImageUrl || undefined,
          resolution,
          duration,
          generate_audio: true,
        },
        logs: false,
      }
    );

    const videoUrl = result.data?.video?.url;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Aucune vidéo retournée par Seedance" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      videoUrl,
      seed: result.data?.seed ?? null,
    });
  } catch (error) {
    console.error("fal.ai Seedance 2.5 error:", error);

    return NextResponse.json(
      { error: "Génération vidéo échouée" },
      { status: 500 }
    );
  }
}