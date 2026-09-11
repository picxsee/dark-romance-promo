import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu aides un auteur de romans dark romance à créer la fiche visuelle d'un personnage.
Pose UNE question à la fois, dans l'ordre suivant, en t'adaptant aux réponses déjà données :
1. Âge et genre du personnage
2. Apparence générale (silhouette, cheveux, yeux, style)
3. Signe distinctif : cicatrice, tatouage, hétérochromie, ou toute autre particularité physique marquante (demande explicitement s'il y en a un)
4. Style vestimentaire et ambiance/personnalité qui doit transparaître dans le regard ou la posture

Sois chaleureux, concis, une question à la fois, jamais plus de 2 phrases.
Quand tu as assez d'informations (après la question sur le style), termine ta réponse par une ligne séparée commençant EXACTEMENT par "PROMPT_FINAL:" suivie d'une description visuelle dense et compacte en anglais ou français, optimisée pour un générateur d'images, incluant tous les détails collectés (âge, apparence, signe distinctif, style, ambiance).`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Historique de conversation requis' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reply = textBlock && 'text' in textBlock ? textBlock.text : '';

    let finalPrompt: string | null = null;
    let displayReply = reply;

    const marker = 'PROMPT_FINAL:';
    const markerIndex = reply.indexOf(marker);
    if (markerIndex !== -1) {
      displayReply = reply.slice(0, markerIndex).trim();
      finalPrompt = reply.slice(markerIndex + marker.length).trim();
    }

    return NextResponse.json({ reply: displayReply, finalPrompt });
  } catch (error) {
    console.error('Character chat error:', error);
    return NextResponse.json({ error: 'Erreur de conversation avec Claude' }, { status: 500 });
  }
}
