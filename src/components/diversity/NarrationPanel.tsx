import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Loader2, Play, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateNarrative,
  getIntegrationStatus,
  speakNarrative,
} from "@/lib/egoverse.functions";

export function NarrationPanel({ facts }: { facts: string }) {
  const narrate = useServerFn(generateNarrative);
  const speak = useServerFn(speakNarrative);
  const status = useServerFn(getIntegrationStatus);

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "llm" | "tts">(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: integrations } = useQuery({
    queryKey: ["integration-status"],
    queryFn: () => status(),
  });

  async function onGenerate() {
    setBusy("llm");
    setError(null);
    setAudioUrl(null);
    try {
      const res = await narrate({ data: { facts } });
      if (!res.ok) setError(res.error);
      else setText(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  async function onSpeak() {
    if (!text) return;
    setBusy("tts");
    setError(null);
    try {
      const res = await speak({ data: { text } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const url = `data:${res.mimeType};base64,${res.audioBase64}`;
      setAudioUrl(url);
      requestAnimationFrame(() => void audioRef.current?.play());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip
          ok={integrations?.lovable}
          label={`Lovable AI · ${integrations?.lovableModel ?? "unconfigured"}`}
        />
        <StatusChip ok={integrations?.elevenlabs} label="ElevenLabs TTS" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onGenerate} disabled={busy !== null}>
          {busy === "llm" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Sparkles />
          )}
          Write demo narrative
        </Button>
        <Button variant="secondary" onClick={onSpeak} disabled={busy !== null || !text}>
          {busy === "tts" ? <Loader2 className="animate-spin" /> : <Volume2 />}
          Speak it
        </Button>
        {audioUrl ? (
          <Button variant="ghost" onClick={() => void audioRef.current?.play()}>
            <Play /> Replay
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive-foreground">
          {error}
        </p>
      ) : null}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="The generated narrative appears here — editable before you send it to ElevenLabs."
        rows={7}
        className="w-full resize-y rounded-lg border border-border bg-background/60 p-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
      />

      {audioUrl ? <audio ref={audioRef} src={audioUrl} controls className="w-full" /> : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        The model receives only precomputed numbers and is instructed not to rank anything. Scoring
        stays deterministic — this is a presentation layer, not a judge.
      </p>
    </div>
  );
}

function StatusChip({ ok, label }: { ok?: boolean | undefined; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1 text-xs text-muted-foreground">
      <span
        className={`size-1.5 rounded-full ${
          ok === undefined ? "bg-muted-foreground" : ok ? "bg-signal" : "bg-warn"
        }`}
      />
      {label}
      {ok === false ? " — key missing" : ""}
    </span>
  );
}
