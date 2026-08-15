import { Check, X } from "lucide-react";
import type { SanityCase } from "@/data/metrics";

export function SanityHarness({ cases }: { cases: SanityCase[] }) {
  const observed = [...cases].sort((a, b) => b.index - a.index);
  const passes = observed.every((c, i) => c.expectedRank === i + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={`flex size-5 items-center justify-center rounded-full ${
            passes ? "bg-signal/20 text-signal" : "bg-destructive/20 text-destructive"
          }`}
        >
          {passes ? <Check className="size-3" /> : <X className="size-3" />}
        </span>
        <span className="text-sm font-medium">
          {passes ? "Ranking matches ground truth" : "Ranking violates ground truth"}
        </span>
      </div>
      <ol className="space-y-2">
        {observed.map((c, i) => (
          <li
            key={c.name}
            className="flex items-center gap-3 rounded-md border border-border bg-background/50 px-3 py-2"
          >
            <span className="num text-xs text-muted-foreground">#{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm">{c.name}</div>
              <div className="truncate text-xs text-muted-foreground">{c.detail}</div>
            </div>
            <span className="num text-sm text-primary">{c.index.toFixed(2)}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Three constructed subsets with known diversity ordering. The index must rank them
        single-scene &lt; single-demonstrator &lt; stratified-random, or the metric is not measuring
        what it claims.
      </p>
    </div>
  );
}
