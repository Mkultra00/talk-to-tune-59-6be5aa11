/**
 * Mock precomputed metrics — the exact shape your Modal job should emit as
 * `metrics.json`. Swap `DATASETS` for a fetch of that file (or a Cloud table)
 * once the Python pipeline runs; nothing else in the UI changes.
 *
 * The pipeline scores each *dataset* independently. The dashboard then picks
 * any two of them as slot A and slot B and compares.
 */

export type SubsetId = "a" | "b";

export type AxisScore = {
  key: string;
  label: string;
  description: string;
  /** Normalized 0..1 for the composite index */
  a: number;
  b: number;
  /** Human-readable raw value shown next to the bar */
  rawA: string;
  rawB: string;
};

export type UmapPoint = { x: number; y: number; subset: SubsetId };

export type SanityCase = {
  name: string;
  detail: string;
  index: number;
  expectedRank: number;
};

export type FieldEntropy = { field: string; a: number; b: number };

export type SubsetSummary = {
  label: string;
  episodes: number;
  hours: number;
  scenes: number;
  demonstrators: number;
};

export type Metrics = {
  generatedAt: string;
  pipeline: string;
  subsets: Record<SubsetId, SubsetSummary>;
  axes: AxisScore[];
  fieldEntropy: FieldEntropy[];
  umap: UmapPoint[];
  sanity: SanityCase[];
  vendiStability: { bandwidth: string; a: number; b: number }[];
};

/** One scored dataset as emitted by the offline job. */
export type Dataset = {
  id: string;
  label: string;
  blurb: string;
  episodes: number;
  hours: number;
  scenes: number;
  demonstrators: number;
  /** normalized 0..1 per axis key */
  axis: Record<string, number>;
  /** raw display value per axis key */
  axisRaw: Record<string, string>;
  fieldEntropy: Record<string, number>;
  vendiStability: Record<string, number>;
  /** UMAP cluster centers: [cx, cy, spread, n] */
  clusters: [number, number, number, number][];
  seed: number;
};

export const AXIS_META = [
  {
    key: "visual",
    label: "Visual (Vendi Score)",
    description:
      "exp(Shannon entropy of the eigenvalues of the cosine-similarity kernel over DINOv3 frame embeddings). Normalized by n=2000.",
  },
  {
    key: "metadata",
    label: "Metadata coverage",
    description:
      "Mean normalized Shannon entropy across scene / task / object / demonstrator category distributions.",
  },
  {
    key: "motion",
    label: "Motion signature",
    description:
      "Vendi Score over 32-d per-episode motion descriptors (hand velocity histogram, path curvature, head-pose energy).",
  },
] as const;

export const ENTROPY_FIELDS = ["scene_id", "task", "primary_object", "demonstrator_id"] as const;

export const KERNELS = [
  "cosine kernel (σ = 1.0)",
  "RBF kernel (σ = 0.5)",
  "RBF kernel (σ = 2.0)",
] as const;

export const DATASETS: Dataset[] = [
  {
    id: "unfiltered",
    label: "Unfiltered draw",
    blurb: "2000 random episodes, no balancing — collapses onto a few dominant scenes.",
    episodes: 2000,
    hours: 34.1,
    scenes: 41,
    demonstrators: 62,
    axis: { visual: 0.47, metadata: 0.48, motion: 0.39 },
    axisRaw: { visual: "14.2", metadata: "0.48", motion: "9.8" },
    fieldEntropy: { scene_id: 0.41, task: 0.55, primary_object: 0.52, demonstrator_id: 0.44 },
    vendiStability: {
      "cosine kernel (σ = 1.0)": 14.2,
      "RBF kernel (σ = 0.5)": 13.6,
      "RBF kernel (σ = 2.0)": 15.1,
    },
    clusters: [
      [0.34, 0.42, 0.14, 90],
      [0.58, 0.3, 0.09, 45],
    ],
    seed: 20260815,
  },
  {
    id: "curated",
    label: "Curated draw",
    blurb: "2000 episodes stratified over scene × task × demonstrator strata.",
    episodes: 2000,
    hours: 33.6,
    scenes: 118,
    demonstrators: 214,
    axis: { visual: 0.61, metadata: 0.61, motion: 0.72 },
    axisRaw: { visual: "18.3", metadata: "0.61", motion: "21.4" },
    fieldEntropy: { scene_id: 0.68, task: 0.66, primary_object: 0.59, demonstrator_id: 0.71 },
    vendiStability: {
      "cosine kernel (σ = 1.0)": 18.3,
      "RBF kernel (σ = 0.5)": 17.8,
      "RBF kernel (σ = 2.0)": 19.0,
    },
    clusters: [
      [0.3, 0.62, 0.13, 40],
      [0.66, 0.6, 0.12, 40],
      [0.5, 0.24, 0.11, 30],
      [0.78, 0.4, 0.1, 25],
    ],
    seed: 771903,
  },
  {
    id: "single-scene",
    label: "Single scene",
    blurb: "2000 episodes from one scene_id — the degenerate low-diversity control.",
    episodes: 2000,
    hours: 31.9,
    scenes: 1,
    demonstrators: 28,
    axis: { visual: 0.19, metadata: 0.16, motion: 0.27 },
    axisRaw: { visual: "5.1", metadata: "0.16", motion: "6.4" },
    fieldEntropy: { scene_id: 0.02, task: 0.31, primary_object: 0.22, demonstrator_id: 0.29 },
    vendiStability: {
      "cosine kernel (σ = 1.0)": 5.1,
      "RBF kernel (σ = 0.5)": 4.7,
      "RBF kernel (σ = 2.0)": 5.6,
    },
    clusters: [[0.42, 0.46, 0.07, 120]],
    seed: 331277,
  },
  {
    id: "single-demonstrator",
    label: "Single demonstrator",
    blurb: "One person across many scenes — visually varied, motion-collapsed.",
    episodes: 2000,
    hours: 32.7,
    scenes: 74,
    demonstrators: 1,
    axis: { visual: 0.52, metadata: 0.38, motion: 0.21 },
    axisRaw: { visual: "15.4", metadata: "0.38", motion: "5.2" },
    fieldEntropy: { scene_id: 0.62, task: 0.51, primary_object: 0.48, demonstrator_id: 0.0 },
    vendiStability: {
      "cosine kernel (σ = 1.0)": 15.4,
      "RBF kernel (σ = 0.5)": 14.9,
      "RBF kernel (σ = 2.0)": 16.2,
    },
    clusters: [
      [0.36, 0.52, 0.15, 70],
      [0.68, 0.44, 0.12, 55],
    ],
    seed: 918441,
  },
  {
    id: "long-tail",
    label: "Long-tail boosted",
    blurb: "Rare scenes and objects oversampled — highest coverage, thinnest per-mode support.",
    episodes: 2000,
    hours: 35.4,
    scenes: 163,
    demonstrators: 188,
    axis: { visual: 0.69, metadata: 0.74, motion: 0.63 },
    axisRaw: { visual: "21.1", metadata: "0.74", motion: "18.7" },
    fieldEntropy: { scene_id: 0.81, task: 0.72, primary_object: 0.77, demonstrator_id: 0.66 },
    vendiStability: {
      "cosine kernel (σ = 1.0)": 21.1,
      "RBF kernel (σ = 0.5)": 20.4,
      "RBF kernel (σ = 2.0)": 22.0,
    },
    clusters: [
      [0.24, 0.34, 0.11, 32],
      [0.5, 0.7, 0.12, 32],
      [0.74, 0.28, 0.11, 30],
      [0.8, 0.66, 0.1, 28],
      [0.44, 0.44, 0.09, 28],
    ],
    seed: 550231,
  },
];

export const DEFAULT_SELECTION = { a: "unfiltered", b: "curated" };

export function getDataset(id: string): Dataset {
  return DATASETS.find((d) => d.id === id) ?? DATASETS[0]!;
}

/** Deterministic PRNG so SSR and client render identical point clouds. */
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildUmap(dataset: Dataset, subset: SubsetId): UmapPoint[] {
  const rand = mulberry32(dataset.seed);
  const pts: UmapPoint[] = [];
  for (const [cx, cy, spread, n] of dataset.clusters) {
    for (let i = 0; i < n; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = Math.sqrt(rand()) * spread;
      pts.push({
        x: Number((cx + Math.cos(angle) * radius).toFixed(4)),
        y: Number((cy + Math.sin(angle) * radius).toFixed(4)),
        subset,
      });
    }
  }
  return pts;
}

function summary(d: Dataset): SubsetSummary {
  return {
    label: d.label,
    episodes: d.episodes,
    hours: d.hours,
    scenes: d.scenes,
    demonstrators: d.demonstrators,
  };
}

export function buildMetrics(aId: string, bId: string): Metrics {
  const A = getDataset(aId);
  const B = getDataset(bId);
  return {
    generatedAt: "2026-08-15T13:40:00Z",
    pipeline:
      "modal://egoverse-diversity · DINOv3 ViT-L/16 · 8 frames/episode · n=2000 fixed per dataset",
    subsets: { a: summary(A), b: summary(B) },
    axes: AXIS_META.map((ax) => ({
      key: ax.key,
      label: ax.label,
      description: ax.description,
      a: A.axis[ax.key] ?? 0,
      b: B.axis[ax.key] ?? 0,
      rawA: A.axisRaw[ax.key] ?? "—",
      rawB: B.axisRaw[ax.key] ?? "—",
    })),
    fieldEntropy: ENTROPY_FIELDS.map((field) => ({
      field,
      a: A.fieldEntropy[field] ?? 0,
      b: B.fieldEntropy[field] ?? 0,
    })),
    umap: [...buildUmap(A, "a"), ...buildUmap(B, "b")],
    sanity: [
      {
        name: "Single scene",
        detail: "2000 episodes drawn from one scene_id",
        index: 0.18,
        expectedRank: 3,
      },
      {
        name: "Single demonstrator",
        detail: "2000 episodes from one demonstrator across scenes",
        index: 0.34,
        expectedRank: 2,
      },
      {
        name: "Stratified random",
        detail: "Balanced draw across scene × task strata",
        index: 0.79,
        expectedRank: 1,
      },
    ],
    vendiStability: KERNELS.map((bandwidth) => ({
      bandwidth,
      a: A.vendiStability[bandwidth] ?? 0,
      b: B.vendiStability[bandwidth] ?? 0,
    })),
  };
}

/** Back-compat default pairing. */
export function getMetrics(): Metrics {
  return buildMetrics(DEFAULT_SELECTION.a, DEFAULT_SELECTION.b);
}

export const DEFAULT_WEIGHTS: Record<string, number> = {
  visual: 34,
  metadata: 33,
  motion: 33,
};

export function compositeIndex(
  axes: AxisScore[],
  weights: Record<string, number>,
  subset: SubsetId,
): number {
  const total = axes.reduce((sum, ax) => sum + (weights[ax.key] ?? 0), 0);
  if (total === 0) return 0;
  return (
    axes.reduce((sum, ax) => sum + (weights[ax.key] ?? 0) * ax[subset], 0) / total
  );
}
