import { useEffect, useRef, useState } from "react";
import type { SubsetId } from "@/data/metrics";

/**
 * Cute dancing robot whose choreography is driven by the motion-diversity
 * score of a subset. Low motion Vendi => tiny repertoire, the robot loops the
 * same move. High motion Vendi => many distinct moves, richer amplitudes.
 */

type Move = {
  name: string;
  /** beats per cycle */
  speed: number;
  armAmp: number;
  armPhase: number;
  legAmp: number;
  hipAmp: number;
  tiltAmp: number;
  bounceAmp: number;
  spin: number;
};

const MOVE_POOL: Move[] = [
  { name: "step-touch", speed: 1.0, armAmp: 22, armPhase: Math.PI, legAmp: 10, hipAmp: 4, tiltAmp: 4, bounceAmp: 3, spin: 0 },
  { name: "robot-arms", speed: 1.4, armAmp: 62, armPhase: 0, legAmp: 4, hipAmp: 2, tiltAmp: 2, bounceAmp: 2, spin: 0 },
  { name: "hip-sway", speed: 0.8, armAmp: 30, armPhase: Math.PI / 2, legAmp: 6, hipAmp: 12, tiltAmp: 9, bounceAmp: 4, spin: 0 },
  { name: "running-man", speed: 1.8, armAmp: 48, armPhase: Math.PI, legAmp: 26, hipAmp: 5, tiltAmp: 5, bounceAmp: 7, spin: 0 },
  { name: "spin-out", speed: 1.1, armAmp: 40, armPhase: Math.PI / 3, legAmp: 12, hipAmp: 6, tiltAmp: 3, bounceAmp: 4, spin: 1 },
  { name: "wave", speed: 1.2, armAmp: 75, armPhase: Math.PI / 6, legAmp: 5, hipAmp: 3, tiltAmp: 12, bounceAmp: 2, spin: 0 },
  { name: "kick-out", speed: 1.5, armAmp: 35, armPhase: Math.PI / 2, legAmp: 34, hipAmp: 8, tiltAmp: 6, bounceAmp: 6, spin: 0 },
  { name: "shimmy", speed: 2.2, armAmp: 18, armPhase: Math.PI, legAmp: 8, hipAmp: 14, tiltAmp: 3, bounceAmp: 2, spin: 0 },
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic move list: repertoire size scales with motion diversity. */
export function choreography(motion: number, seed: number) {
  const count = Math.max(1, Math.min(MOVE_POOL.length, Math.round(1 + motion * 7)));
  const rnd = mulberry32(seed);
  const pool = [...MOVE_POOL];
  const picked: Move[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rnd() * pool.length) % Math.max(1, pool.length);
    picked.push(pool.splice(idx, 1)[0]!);
  }
  return picked;
}

const BARS = 2.4; // seconds per move

export function DancingRobot({
  subset,
  label,
  motion,
  motionRaw,
  seed,
  playing,
  sync = false,
}: {
  subset: SubsetId;
  label: string;
  motion: number;
  motionRaw: string;
  seed: number;
  playing: boolean;
  /** When true, every robot attempts the SAME move from the global pool. */
  sync?: boolean;
}) {
  const moves = choreography(motion, seed);
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const held = useRef(0);

  useEffect(() => {
    if (!playing) {
      held.current = t;
      return;
    }
    const base = held.current;
    start.current = null;
    const loop = (ts: number) => {
      if (start.current === null) start.current = ts;
      setT(base + (ts - start.current) / 1000);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // In sync mode both robots are asked for the same target move from the full
  // pool. A robot only performs it cleanly if that move is in its repertoire;
  // otherwise it approximates with its closest known move at reduced amplitude.
  const targetIdx = Math.floor(t / BARS) % MOVE_POOL.length;
  const target = MOVE_POOL[targetIdx]!;
  const known = sync ? moves.some((m) => m.name === target.name) : true;
  const moveIdx = sync
    ? known
      ? moves.findIndex((m) => m.name === target.name)
      : targetIdx % moves.length
    : Math.floor(t / BARS) % moves.length;
  const base = sync && known ? target : moves[Math.max(0, moveIdx)]!;
  const damp = sync && !known ? 0.45 : 1;
  const move = base;
  const p = t * (sync ? target.speed : move.speed) * Math.PI * 2;

  const armL = Math.sin(p) * move.armAmp * damp;
  const armR = Math.sin(p + move.armPhase) * move.armAmp * damp;
  const legL = Math.sin(p) * move.legAmp * damp;
  const legR = Math.sin(p + Math.PI) * move.legAmp * damp;
  const hip = Math.sin(p * 0.5) * move.hipAmp * damp;
  const tilt = Math.sin(p * 0.5) * move.tiltAmp * damp;
  const bounce = Math.abs(Math.sin(p)) * -move.bounceAmp * damp;
  const spin = move.spin ? Math.sin(p * 0.25) * 28 * damp : 0;
  const blink = Math.sin(t * 1.7) > 0.985 ? 0.15 : 1;

  const color = subset === "a" ? "var(--chart-1, oklch(0.72 0.16 45))" : "var(--chart-2, oklch(0.72 0.14 200))";
  const f = (n: number) => n.toFixed(2);


  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="num text-[11px] uppercase tracking-wider text-muted-foreground">
          Subset {subset.toUpperCase()}
        </span>
        <span className="num text-[11px] text-muted-foreground">{motionRaw}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium">{label}</p>

      <svg viewBox="0 0 120 150" className="mx-auto mt-2 h-52 w-full" role="img" aria-label={`Robot dancing the ${move.name} move for subset ${subset}`}>
        <defs>
          <radialGradient id={`floor-${subset}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="140" rx="34" ry="7" fill={`url(#floor-${subset})`} />
        <g transform={`translate(60 ${f(78 + bounce)}) rotate(${f(spin)}) translate(-60 -78)`}>
          {/* legs */}
          <g stroke={color} strokeWidth="7" strokeLinecap="round" opacity="0.9">
            <line x1="52" y1="112" x2={f(50 + legL * 0.6)} y2={f(134 - Math.abs(legL) * 0.4)} />
            <line x1="68" y1="112" x2={f(70 + legR * 0.6)} y2={f(134 - Math.abs(legR) * 0.4)} />
          </g>
          {/* arms */}
          <g stroke={color} strokeWidth="6" strokeLinecap="round">
            <line x1="42" y1="82" x2={f(42 - 18 * Math.cos(armL * 0.0175))} y2={f(82 + 18 * Math.sin(armL * 0.0175))} />
            <line x1="78" y1="82" x2={f(78 + 18 * Math.cos(armR * 0.0175))} y2={f(82 + 18 * Math.sin(armR * 0.0175))} />
          </g>
          {/* body */}
          <g transform={`translate(60 90) rotate(${f(hip)}) translate(-60 -90)`}>
            <rect x="42" y="72" width="36" height="42" rx="12" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2.5" />
            <circle cx="60" cy="93" r="5" fill={color} fillOpacity="0.8" />
          </g>
          {/* head */}
          <g transform={`translate(60 52) rotate(${f(tilt)}) translate(-60 -52)`}>
            <line x1="60" y1="34" x2="60" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="60" cy="23" r="3.6" fill={color}>
              <animate attributeName="r" values="3.2;4.4;3.2" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <rect x="38" y="34" width="44" height="36" rx="14" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="2.5" />
            <g fill={color}>
              <ellipse cx="50" cy="50" rx="4.4" ry={f(4.4 * blink)} />
              <ellipse cx="70" cy="50" rx="4.4" ry={f(4.4 * blink)} />
            </g>
            <path d="M52 60 q8 7 16 0" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="42" cy="59" r="3" fill={color} fillOpacity="0.35" />
            <circle cx="78" cy="59" r="3" fill={color} fillOpacity="0.35" />
          </g>
        </g>
      </svg>

      <div className="mt-1 space-y-1">
        <p className="num text-center text-[11px] text-muted-foreground">
          move {moveIdx + 1}/{moves.length} · <span className="text-foreground">{move.name}</span>
        </p>
        <div className="flex flex-wrap justify-center gap-1">
          {moves.map((m, i) => (
            <span
              key={m.name}
              className={`num rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                i === moveIdx ? "bg-primary/20 text-foreground" : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {m.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
