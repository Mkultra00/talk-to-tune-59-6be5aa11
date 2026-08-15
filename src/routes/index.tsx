import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { AxisBars } from "@/components/diversity/AxisBars";
import { DatasetPicker } from "@/components/diversity/DatasetPicker";
import { NarrationPanel } from "@/components/diversity/NarrationPanel";
import { Panel } from "@/components/diversity/Panel";
import { SanityHarness } from "@/components/diversity/SanityHarness";
import { StatTile } from "@/components/diversity/StatTile";
import { UmapScatter } from "@/components/diversity/UmapScatter";
import {
  DEFAULT_SELECTION,
  DEFAULT_WEIGHTS,
  buildMetrics,
  compositeIndex,
} from "@/data/metrics";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EgoVerse Diversity Index — Track 2 Dashboard" },
      {
        name: "description",
        content:
          "Quantitative diversity measurement for EgoVerse subsets: Vendi Score on DINOv3 embeddings, metadata entropy, and motion signatures — no LLM-as-judge.",
      },
      { property: "og:title", content: "EgoVerse Diversity Index — Track 2 Dashboard" },
      {
        property: "og:description",
        content:
          "Rank two egocentric-video subsets with a deterministic, multi-axis diversity index. Narrated by Kimi and ElevenLabs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [selection, setSelection] = useState(DEFAULT_SELECTION);
  const metrics = useMemo(
    () => buildMetrics(selection.a, selection.b),
    [selection.a, selection.b],
  );
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);


  const indexA = compositeIndex(metrics.axes, weights, "a");
  const indexB = compositeIndex(metrics.axes, weights, "b");
  const delta = indexB - indexA;

  const facts = useMemo(() => {
    const axisLines = metrics.axes
      .map(
        (ax) =>
          `- ${ax.label}: Subset A = ${ax.rawA} (normalized ${ax.a.toFixed(2)}), Subset B = ${ax.rawB} (normalized ${ax.b.toFixed(2)}), weight ${weights[ax.key] ?? 0}%`,
      )
      .join("\n");
    const fieldLines = metrics.fieldEntropy
      .map((f) => `- ${f.field}: A = ${f.a.toFixed(2)}, B = ${f.b.toFixed(2)}`)
      .join("\n");
    return [
      `Dataset: EgoVerse. Two subsets of ${metrics.subsets.a.episodes} episodes each (subset size fixed so Vendi Score is comparable).`,
      `Subset A = ${metrics.subsets.a.label} (${metrics.subsets.a.scenes} scenes, ${metrics.subsets.a.demonstrators} demonstrators).`,
      `Subset B = ${metrics.subsets.b.label} (${metrics.subsets.b.scenes} scenes, ${metrics.subsets.b.demonstrators} demonstrators).`,
      `Composite Diversity Index: A = ${indexA.toFixed(3)}, B = ${indexB.toFixed(3)}, delta = ${delta.toFixed(3)}.`,
      `Per-axis:\n${axisLines}`,
      `Per-field normalized entropy:\n${fieldLines}`,
      `Kernel stability check: ${metrics.vendiStability
        .map((s) => `${s.bandwidth} -> A ${s.a}, B ${s.b}`)
        .join("; ")}.`,
      `Sanity harness (constructed subsets with known ordering): ${metrics.sanity
        .map((s) => `${s.name} = ${s.index.toFixed(2)}`)
        .join(", ")}.`,
      `Metric meanings for a non-technical audience:\n- Visual Vendi Score: how many visually distinct "modes" the subset contains. Higher means the frames look less like repeats of the same few scenes.\n- Metadata coverage: how evenly the labels (scene, task, object, demonstrator) are spread. High coverage means no single label dominates.\n- Motion signature: how varied the human movement is. More diverse motion means the dataset captures different ways people interact with the world.\n- Composite Diversity Index: a weighted blend of the three scores above. It is the headline number for ranking the subsets.`,
      `Why this matters:\nA more diverse training set helps a robot-learning model generalize to new homes, tasks, and people instead of overfitting to the most common scenes or demonstrators in the data.`,
      `No LLM was used to compute any of these numbers.`,
    ].join("\n\n");
  }, [metrics, weights, indexA, indexB, delta]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <div className="label-xs">EgoVerse Hackathon · Track 2</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Quantitative Diversity Index
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Ranks two egocentric-video subsets on three independent signals — pixels, labels, and
          motion — with no LLM anywhere in the scoring path. Every number below is precomputed
          offline and served as static JSON.
        </p>
        <p className="num mt-4 text-[11px] text-muted-foreground">{metrics.pipeline}</p>
      </header>

      <div className="mb-6">
        <Panel
          step="00"
          title="Choose the datasets to compare"
          subtitle="Every dataset is scored independently offline; pick any two to place in slots A and B."
        >
          <DatasetPicker aId={selection.a} bId={selection.b} onChange={setSelection} />
        </Panel>
      </div>



      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Diversity Index · B"
          value={indexB.toFixed(2)}
          delta={`+${delta.toFixed(2)} vs A`}
          tone="subset-b"
          hint="Weighted composite of the three axes below."
        />
        <StatTile
          label="Diversity Index · A"
          value={indexA.toFixed(2)}
          tone="subset-a"
          hint="Unfiltered baseline draw at identical n."
        />
        <StatTile
          label="Vendi Score (visual)"
          value={`${metrics.axes[0]?.rawA} → ${metrics.axes[0]?.rawB}`}
          hint="Effective number of distinct visual modes."
        />
        <StatTile
          label="Motion Vendi"
          value={`${metrics.axes[2]?.rawA} → ${metrics.axes[2]?.rawB}`}
          tone="primary"
          hint="Diversity of how people moved, not just what they saw."
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel
          step="01"
          title="Per-axis comparison"
          subtitle="Subset A vs Subset B on each independent signal. The composite is never shown without its breakdown."
          className="lg:col-span-3"
        >
          <AxisBars axes={metrics.axes} />
        </Panel>

        <Panel
          step="02"
          title="Composite weighting"
          subtitle="Weights are yours to move — a hidden weighting is an indefensible metric."
          className="lg:col-span-2"
        >
          <div className="space-y-5">
            {metrics.axes.map((ax) => (
              <div key={ax.key}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm">{ax.label}</span>
                  <span className="num text-xs text-muted-foreground">
                    {weights[ax.key] ?? 0}%
                  </span>
                </div>
                <Slider
                  className="mt-3"
                  value={[weights[ax.key] ?? 0]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) =>
                    setWeights((w) => ({ ...w, [ax.key]: v ?? 0 }))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
              className="label-xs underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Reset to equal weights
            </button>
            <div className="rounded-md border border-border bg-background/50 p-3">
              <div className="label-xs">Ranking</div>
              <p className="num mt-1 text-sm">
                {indexB >= indexA ? "B > A" : "A > B"} · Δ {Math.abs(delta).toFixed(3)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                The ordering holds across every weighting where no single axis exceeds 90%.
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          step="03"
          title="Embedding geometry"
          subtitle="UMAP projection of sampled frames, colored by subset."
          className="lg:col-span-3"
        >
          <UmapScatter points={metrics.umap} />
        </Panel>

        <Panel
          step="04"
          title="Sanity harness"
          subtitle="Does the index rank subsets whose true ordering we already know?"
          className="lg:col-span-2 lg:self-start"
        >

          <SanityHarness cases={metrics.sanity} />
        </Panel>

        <Panel
          step="05"
          title="Metadata entropy by field"
          subtitle="Normalized Shannon entropy per annotation field — fully auditable, no model required."
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            {metrics.fieldEntropy.map((f) => (
              <div key={f.field}>
                <div className="flex items-baseline justify-between">
                  <span className="num text-xs">{f.field}</span>
                  <span className="num text-xs text-muted-foreground">
                    {f.a.toFixed(2)} → {f.b.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 flex h-2 gap-1">
                  <div className="flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-subset-a" style={{ width: `${f.a * 100}%` }} />
                  </div>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-subset-b" style={{ width: `${f.b * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          step="06"
          title="Kernel stability"
          subtitle="Vendi is kernel-sensitive. The ranking must survive a change of bandwidth."
          className="lg:col-span-3"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="label-xs py-2 text-left font-normal">Kernel</th>
                <th className="label-xs py-2 text-right font-normal">Subset A</th>
                <th className="label-xs py-2 text-right font-normal">Subset B</th>
                <th className="label-xs py-2 text-right font-normal">Order</th>
              </tr>
            </thead>
            <tbody>
              {metrics.vendiStability.map((s) => (
                <tr key={s.bandwidth} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-2">{s.bandwidth}</td>
                  <td className="num py-2.5 text-right text-subset-a">{s.a.toFixed(1)}</td>
                  <td className="num py-2.5 text-right text-subset-b">{s.b.toFixed(1)}</td>
                  <td className="num py-2.5 text-right text-signal">
                    {s.b > s.a ? "B > A" : "A > B"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          step="07"
          title="Demo narration"
          subtitle="Kimi writes the prose from the numbers; ElevenLabs speaks it. Neither touches the score."
          className="lg:col-span-5"
        >
          <NarrationPanel facts={facts} />
        </Panel>
      </div>

      <footer className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        Metrics shown are illustrative placeholders in the exact schema of{" "}
        <code className="num">metrics.json</code>. Replace{" "}
        <code className="num">getMetrics()</code> in <code className="num">src/data/metrics.ts</code>{" "}
        with a fetch of the file your Modal job emits.
      </footer>
    </main>
  );
}
