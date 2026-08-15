import { ArrowLeftRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATASETS, type Dataset } from "@/data/metrics";

type Props = {
  aId: string;
  bId: string;
  onChange: (next: { a: string; b: string }) => void;
};

function Slot({
  tone,
  slot,
  value,
  otherValue,
  onValueChange,
}: {
  tone: "a" | "b";
  slot: string;
  value: string;
  otherValue: string;
  onValueChange: (id: string) => void;
}) {
  const dataset = DATASETS.find((d) => d.id === value) as Dataset;
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${tone === "a" ? "bg-subset-a" : "bg-subset-b"}`}
          aria-hidden
        />
        <span className="label-xs">{slot}</span>
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="mt-2 w-full" aria-label={`Dataset for ${slot}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATASETS.map((d) => (
            <SelectItem key={d.id} value={d.id} disabled={d.id === otherValue}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{dataset?.blurb}</p>
      <p className="num mt-1 text-[11px] text-muted-foreground">
        {dataset?.episodes} episodes · {dataset?.scenes} scenes · {dataset?.demonstrators}{" "}
        demonstrators · {dataset?.hours}h
      </p>
    </div>
  );
}

export function DatasetPicker({ aId, bId, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <Slot
        tone="a"
        slot="Subset A"
        value={aId}
        otherValue={bId}
        onValueChange={(id) => onChange({ a: id, b: bId })}
      />
      <button
        type="button"
        onClick={() => onChange({ a: bId, b: aId })}
        title="Swap A and B"
        aria-label="Swap A and B"
        className="self-center rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </button>
      <Slot
        tone="b"
        slot="Subset B"
        value={bId}
        otherValue={aId}
        onValueChange={(id) => onChange({ a: aId, b: id })}
      />
    </div>
  );
}
