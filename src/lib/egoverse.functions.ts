import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Narrative generation via Lovable AI Gateway.
 * The LLM never touches the score — it only writes prose about numbers that
 * were computed deterministically upstream.
 */
const NarrateInput = z.object({
  facts: z.string().min(1),
});

const NARRATE_MODEL = "google/gemini-3.6-flash";

const SYSTEM_PROMPT =
  "You are a wildly enthusiastic, funny science presenter hyping up a dataset diversity audit at a hackathon demo for a non-technical crowd. You are given precomputed metrics. NEVER invent numbers, never re-rank the subsets yourself, and never judge diversity qualitatively — the math already decided. Write 120-160 words meant to be spoken out loud with high energy: punchy sentences, playful analogies, one or two light jokes, a little self-aware nerd humor. No markdown, no bullet points, no emoji, no stage directions. Start by naming the two datasets in Subset A and Subset B. Say which subset is more diverse, cite the specific metric deltas given, explain what those metrics mean in everyday language, and say why diversity matters for training a robot-learning model. End with one caveat, delivered as a wink rather than a lecture.";


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

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: NARRATE_MODEL,
          temperature: 0.3,
          maxOutputTokens: 2000,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: data.facts },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return {
          ok: false as const,
          error: `Lovable AI Gateway returned ${res.status}: ${body.slice(0, 300)}`,
        };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const trimmed = (json.choices?.[0]?.message?.content ?? "").trim();
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
