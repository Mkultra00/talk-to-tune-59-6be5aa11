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
  const [hover, setHover] = useState<number | null>(null);

  const visible = useMemo(
    () =>
      points
        .map((p, i) => ({ ...p, i }))
        .filter((p) => (p.subset === "a" ? show.a : show.b)),
    [points, show],
  );

  const centroids = useMemo(() => {
    return (["a", "b"] as const).map((subset) => {
      const pts = points.filter((p) => p.subset === subset);
      if (pts.length === 0) return { subset, x: 50, y: 50, spread: 0 };
      const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const spread =
        Math.sqrt(
          pts.reduce((s, p) => s + (p.x - x) ** 2 + (p.y - y) ** 2, 0) / pts.length,
        ) * 100;
      return { subset, x: x * 100, y: y * 100, spread };
    });
  }, [points]);

  const hovered = hover === null ? null : points[hover];

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

        <div className="relative overflow-hidden rounded-xl border border-border bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_10%,transparent),transparent_60%)]">
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label="UMAP projection of sampled frame embeddings, colored by subset"
            className="aspect-square w-full"
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <filter id="umap-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="halo-a">
                <stop offset="0%" stopColor="var(--color-subset-a)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-subset-a)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="halo-b">
                <stop offset="0%" stopColor="var(--color-subset-b)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-subset-b)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((v) => (
              <g key={v} stroke="var(--color-grid)" strokeWidth={v % 20 === 0 ? 0.22 : 0.1}>
                <line x1={v} y1="0" x2={v} y2="100" />
                <line x1="0" y1={v} x2="100" y2={v} />
              </g>
            ))}

            {centroids.map((c) =>
              (c.subset === "a" ? show.a : show.b) ? (
                <g key={c.subset}>
                  <circle
                    cx={c.x.toFixed(2)}
                    cy={c.y.toFixed(2)}
                    r={(c.spread * 1.6).toFixed(2)}
                    fill={`url(#halo-${c.subset})`}
                  />
                  <circle
                    cx={c.x.toFixed(2)}
                    cy={c.y.toFixed(2)}
                    r={(c.spread * 1.15).toFixed(2)}
                    fill="none"
                    stroke={
                      c.subset === "a" ? "var(--color-subset-a)" : "var(--color-subset-b)"
                    }
                    strokeOpacity="0.35"
                    strokeWidth="0.25"
                    strokeDasharray="1.6 1.6"
                    className="umap-ring"
                  />
                </g>
              ) : null,
            )}

            {visible.map((p) => {
              const active = hover === p.i;
              const dim = hover !== null && !active;
              const color =
                p.subset === "a" ? "var(--color-subset-a)" : "var(--color-subset-b)";
              return (
                <circle
                  key={p.i}
                  cx={(p.x * 100).toFixed(3)}
                  cy={(p.y * 100).toFixed(3)}
                  r={active ? 2.1 : 1}
                  fill={color}
                  fillOpacity={dim ? 0.18 : active ? 1 : 0.75}
                  filter={active ? "url(#umap-glow)" : undefined}
                  onMouseEnter={() => setHover(p.i)}
                  className="umap-dot cursor-crosshair"
                  style={{ animationDelay: `${(p.i % 40) * 22}ms` }}
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
            {centroids.map((c) =>
              (c.subset === "a" ? show.a : show.b) ? (
                <span
                  key={c.subset}
                  className="num rounded-md border border-border/70 bg-background/70 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur"
                >
                  {c.subset.toUpperCase()} spread {c.spread.toFixed(1)}
                </span>
              ) : null,
            )}
          </div>

          <div className="pointer-events-none absolute bottom-3 right-3">
            <span className="num rounded-md border border-border/70 bg-background/80 px-2 py-1 text-[10px] backdrop-blur">
              {hovered
                ? `frame #${(hover ?? 0) + 1} · subset ${hovered.subset.toUpperCase()} · (${(
                    hovered.x * 100
                  ).toFixed(1)}, ${(hovered.y * 100).toFixed(1)})`
                : `${visible.length} frames · hover a dot`}
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          UMAP of DINOv3 frame embeddings. Subset A collapses into two dense lobes; Subset B covers
          four separated regions of the manifold — the visual proof behind the Vendi delta. The
          dashed rings show each subset&rsquo;s spread around its centroid.
        </p>
      </div>
    </TooltipProvider>
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
