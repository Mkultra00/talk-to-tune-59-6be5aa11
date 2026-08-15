type Props = {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  tone?: "primary" | "subset-a" | "subset-b" | "neutral";
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  primary: "text-primary",
  "subset-a": "text-subset-a",
  "subset-b": "text-subset-b",
  neutral: "text-foreground",
};

export function StatTile({ label, value, delta, hint, tone = "neutral" }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur">
      <div className="label-xs">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`num text-3xl font-semibold ${toneClass[tone]}`}>{value}</span>
        {delta ? <span className="num text-xs text-signal">{delta}</span> : null}
      </div>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
