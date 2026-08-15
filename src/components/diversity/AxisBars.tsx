import type { AxisScore } from "@/data/metrics";

export function AxisBars({ axes }: { axes: AxisScore[] }) {
  return (
    <div className="space-y-6">
      {axes.map((ax) => (
        <div key={ax.key}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium">{ax.label}</span>
            <span className="num text-xs text-muted-foreground">
              A {ax.rawA} → B {ax.rawB}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <Bar value={ax.a} color="bg-subset-a" tag="A" />
            <Bar value={ax.b} color="bg-subset-b" tag="B" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ax.description}</p>
        </div>
      ))}
    </div>
  );
}

function Bar({ value, color, tag }: { value: number; color: string; tag: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="num w-4 text-[11px] text-muted-foreground">{tag}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-[width] duration-700 ease-out`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="num w-10 text-right text-xs">{value.toFixed(2)}</span>
    </div>
  );
}
