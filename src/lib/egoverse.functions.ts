import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Narrative generation via a Kimi model served over an OpenAI-compatible
 * endpoint. Point MODAL_LLM_BASE_URL at either:
 *   - your Modal `@modal.fastapi_endpoint` vLLM server (…/v1), or
 *   - https://api.moonshot.ai/v1
 * The LLM never touches the score — it only writes prose about numbers that
 * were computed deterministically upstream.
 */
const NarrateInput = z.object({
  facts: z.string().min(1),
});

export const generateNarrative = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NarrateInput.parse(input))
  .handler(async ({ data }) => {
    const baseUrl = process.env["MODAL_LLM_BASE_URL"];
    const apiKey = process.env["MODAL_LLM_API_KEY"];
    const model = process.env["MODAL_LLM_MODEL"] ?? "kimi-k2-0905-preview";

    if (!baseUrl || !apiKey) {
      return {
        ok: false as const,
        error:
          "Kimi endpoint not configured. Set MODAL_LLM_BASE_URL, MODAL_LLM_API_KEY (and optionally MODAL_LLM_MODEL).",
      };
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You are a research engineer presenting a dataset diversity audit at a hackathon demo. You are given precomputed metrics. NEVER invent numbers, never re-rank the subsets yourself, and never judge diversity qualitatively — the math already decided. Write 90-120 words, spoken aloud, plain sentences, no markdown, no bullet points. Explain which subset is more diverse, cite the specific metric deltas given, and name one caveat.",
          },
          { role: "user", content: data.facts },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false as const,
        error: `LLM endpoint returned ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false as const, error: "Empty response from the model." };
    return { ok: true as const, text, model };
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
  kimi: Boolean(process.env["MODAL_LLM_BASE_URL"] && process.env["MODAL_LLM_API_KEY"]),
  kimiModel: process.env["MODAL_LLM_MODEL"] ?? "kimi-k2-0905-preview",
  elevenlabs: Boolean(process.env["ELEVENLABS_API_KEY"]),
}));
