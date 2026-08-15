/**
 * Mock precomputed metrics — the exact shape your Modal job should emit as
 * `metrics.json`. Swap `getMetrics()` for a fetch of that file (or a Cloud
 * table) once the Python pipeline runs; nothing else in the UI changes.
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

export type Metrics = {
  generatedAt: string;
  pipeline: string;
  subsets: Record<
    SubsetId,
    { label: string; episodes: number; hours: number; scenes: number; demonstrators: number }
  >;
  axes: AxisScore[];
  fieldEntropy: FieldEntropy[];
  umap: UmapPoint[];
  sanity: SanityCase[];
  vendiStability: { bandwidth: string; a: number; b: number }[];
};

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

function cluster(
  rand: () => number,
  cx: number,
  cy: number,
  spread: number,
  n: number,
  subset: SubsetId,
): UmapPoint[] {
  const pts: UmapPoint[] = [];
  for (let i = 0; i < n; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * spread;
    pts.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      subset,
    });
  }
  return pts;
}

function buildUmap(): UmapPoint[] {
  const rand = mulberry32(20260815);
  return [
    // Subset A: unfiltered, collapses onto two dominant scenes
    ...cluster(rand, 0.34, 0.42, 0.14, 90, "a"),
    ...cluster(rand, 0.58, 0.3, 0.09, 45, "a"),
    // Subset B: curated, spread across the manifold
    ...cluster(rand, 0.3, 0.62, 0.13, 40, "b"),
    ...cluster(rand, 0.66, 0.6, 0.12, 40, "b"),
    ...cluster(rand, 0.5, 0.24, 0.11, 30, "b"),
    ...cluster(rand, 0.78, 0.4, 0.1, 25, "b"),
  ];
}

let cached: Metrics | null = null;

export function getMetrics(): Metrics {
  if (cached) return cached;
  cached = {
    generatedAt: "2026-08-15T13:40:00Z",
    pipeline: "modal://egoverse-diversity · DINOv3 ViT-L/16 · 8 frames/episode · n=2000 fixed",
    subsets: {
      a: { label: "Subset A — unfiltered", episodes: 2000, hours: 34.1, scenes: 41, demonstrators: 62 },
      b: { label: "Subset B — curated", episodes: 2000, hours: 33.6, scenes: 118, demonstrators: 214 },
    },
    axes: [
      {
        key: "visual",
        label: "Visual (Vendi Score)",
        description:
          "exp(Shannon entropy of the eigenvalues of the cosine-similarity kernel over DINOv3 frame embeddings). Normalized by n=2000.",
        a: 0.47,
        b: 0.61,
        rawA: "14.2",
        rawB: "18.3",
      },
      {
        key: "metadata",
        label: "Metadata coverage",
        description:
          "Mean normalized Shannon entropy across scene / task / object / demonstrator category distributions.",
        a: 0.48,
        b: 0.61,
        rawA: "0.48",
        rawB: "0.61",
      },
      {
        key: "motion",
        label: "Motion signature",
        description:
          "Vendi Score over 32-d per-episode motion descriptors (hand velocity histogram, path curvature, head-pose energy).",
        a: 0.39,
        b: 0.72,
        rawA: "9.8",
        rawB: "21.4",
      },
    ],
    fieldEntropy: [
      { field: "scene_id", a: 0.41, b: 0.68 },
      { field: "task", a: 0.55, b: 0.66 },
      { field: "primary_object", a: 0.52, b: 0.59 },
      { field: "demonstrator_id", a: 0.44, b: 0.71 },
    ],
    umap: buildUmap(),
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
    vendiStability: [
      { bandwidth: "cosine kernel (σ = 1.0)", a: 14.2, b: 18.3 },
      { bandwidth: "RBF kernel (σ = 0.5)", a: 13.6, b: 17.8 },
      { bandwidth: "RBF kernel (σ = 2.0)", a: 15.1, b: 19.0 },
    ],
  };
  return cached;
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
