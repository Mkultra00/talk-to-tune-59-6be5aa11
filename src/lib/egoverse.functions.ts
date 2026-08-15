import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * Narrative generation via Lovable AI Gateway.
 * The LLM never touches the score — it only writes prose about numbers that
 * were computed deterministically upstream.
 */
const NarrateInput = z.object({
  facts: z.string().min(1),
});

const NARRATE_MODEL = "google/gemini-3.6-flash";

export const generateNarrative = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NarrateInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Lovable AI Gateway is not configured. LOVABLE_API_KEY is missing.",
      };
    }

    const gateway = createLovableAiGatewayProvider(apiKey);

    try {
      const { text } = await generateText({
        model: gateway(NARRATE_MODEL),
        temperature: 0.3,
        maxOutputTokens: 400,
        instructions:
          "You are a research engineer presenting a dataset diversity audit at a hackathon demo. You are given precomputed metrics. NEVER invent numbers, never re-rank the subsets yourself, and never judge diversity qualitatively — the math already decided. Write 90-120 words, spoken aloud, plain sentences, no markdown, no bullet points. Explain which subset is more diverse, cite the specific metric deltas given, and name one caveat.",
        messages: [{ role: "user", content: data.facts }],
      });

      const trimmed = text.trim();
      if (!trimmed) return { ok: false as const, error: "Empty response from the model." };
      return { ok: true as const, text: trimmed, model: NARRATE_MODEL };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false as const, error: `Lovable AI Gateway error: ${message.slice(0, 300)}` };
    }
  });

/**
 * ElevenLabs text-to-speech for the demo narration track.
 * Returns base64 mp3 so the browser can play it without a storage round-trip.
 */
const SpeakInput = z.object({
  text: z.string().min(1).max(4000),
});

export const speakNarrative = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SpeakInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["ELEVENLABS_API_KEY"];
    const voiceId = process.env["ELEVENLABS_VOICE_ID"] ?? "JBFqnCBsd6RMkjVDRZzb";
    const modelId = process.env["ELEVENLABS_MODEL_ID"] ?? "eleven_turbo_v2_5";

    if (!apiKey) {
      return {
        ok: false as const,
        error: "ElevenLabs not configured. Set ELEVENLABS_API_KEY (and optionally ELEVENLABS_VOICE_ID).",
      };
    }

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.text,
          model_id: modelId,
          voice_settings: { stability: 0.4, similarity_boost: 0.75, speed: 1.0 },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false as const,
        error: `ElevenLabs returned ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return { ok: true as const, audioBase64: btoa(binary), mimeType: "audio/mpeg" };
  });

/** Reports which integrations have credentials, so the UI can show setup state. */
export const getIntegrationStatus = createServerFn({ method: "GET" }).handler(async () => ({
  lovable: Boolean(process.env["LOVABLE_API_KEY"]),
  lovableModel: "google/gemini-3.6-flash",
  elevenlabs: Boolean(process.env["ELEVENLABS_API_KEY"]),
}));
