import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { UmapPoint } from "@/data/metrics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = { points: UmapPoint[] };

export function UmapScatter({ points }: Props) {
  const [show, setShow] = useState<{ a: boolean; b: boolean }>({ a: true, b: true });

  const visible = useMemo(
    () => points.filter((p) => (p.subset === "a" ? show.a : show.b)),
    [points, show],
  );

  return (
    <TooltipProvider>
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Toggle
            active={show.a}
            onClick={() => setShow((s) => ({ ...s, a: !s.a }))}
            dot="bg-subset-a"
            label="Subset A"
          />
          <Toggle
            active={show.b}
            onClick={() => setShow((s) => ({ ...s, b: !s.b }))}
            dot="bg-subset-b"
            label="Subset B"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="ml-auto flex items-center gap-1.5 rounded-md p-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                aria-label="What do the dots mean?"
              >
                <Info className="size-3.5" />
                <span className="hidden sm:inline">What do the dots mean?</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>
                Each dot is one sampled video frame. Its position comes from UMAP, a 2D projection
                of DINOv3 visual embeddings. Color shows which subset the frame belongs to. Tight
                clusters = similar frames; spread-out regions = more diverse visual content.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="UMAP projection of sampled frame embeddings, colored by subset"
        className="aspect-square w-full rounded-lg border border-border bg-background/60"
      >
        {[20, 40, 60, 80].map((v) => (
          <g key={v} stroke="var(--color-grid)" strokeWidth="0.2">
            <line x1={v} y1="0" x2={v} y2="100" />
            <line x1="0" y1={v} x2="100" y2={v} />
          </g>
        ))}
        {visible.map((p, i) => (
          <circle
            key={i}
            cx={(p.x * 100).toFixed(3)}
            cy={(p.y * 100).toFixed(3)}
            r="0.95"

            fill={p.subset === "a" ? "var(--color-subset-a)" : "var(--color-subset-b)"}
            fillOpacity="0.72"
          />
        ))}
      </svg>
      <p className="mt-2 text-xs text-muted-foreground">
        UMAP of DINOv3 frame embeddings. Subset A collapses into two dense lobes; Subset B covers
        four separated regions of the manifold — the visual proof behind the Vendi delta.
      </p>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  dot,
  label,
}: {
  active: boolean;
  onClick: () => void;
  dot: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-md border border-border px-2.5 py-1 text-xs transition-colors ${
        active ? "bg-secondary text-foreground" : "bg-transparent text-muted-foreground"
      }`}
    >
      <span className={`size-2 rounded-full ${dot} ${active ? "" : "opacity-30"}`} />
      {label}
    </button>
  );
}
