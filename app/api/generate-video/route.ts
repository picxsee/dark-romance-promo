import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

// Autorise la fonction Vercel à attendre jusqu'à 60 secondes.
// Sans cette ligne, elle est arrêtée après environ 5 secondes
// alors que Seedance est encore en train de générer la vidéo.
export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, scenePrompt, endImageUrl, resolution, duration } =
      await req.json();

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
          resolution: resolution || "720p",
          duration: duration || "auto",
          generate_audio: true,
        },
        logs: false,
      }
    );

    const videoUrl = result.data?.video?.url;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Seedance n'a pas retourné de vidéo." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      videoUrl,
      seed: result.data?.seed,
    });
  } catch (error) {
    console.error("fal.ai Seedance 2.5 error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Génération vidéo échouée";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}-2.5/image-to-video", {
      input: {
        image_url: imageUrl,
        prompt: scenePrompt,
        end_image_url: endImageUrl || undefined,
        resolution: resolution || "720p",
        duration: duration || "auto",
        generate_audio: true,
      },
      logs: false,
    });

    return NextResponse.json({
      videoUrl: result.data.video.url,
      seed: result.data.seed,
    });
  } catch (error) {
    console.error("fal.ai Seedance 2.5 error:", error);
    return NextResponse.json({ error: "Génération vidéo échouée" }, { status: 500 });
  }
}
