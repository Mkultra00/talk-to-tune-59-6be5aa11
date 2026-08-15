# EgoVerse Diversity Auditor

**Live demo:** [https://talk-to-tune-59.lovable.app](https://talk-to-tune-59.lovable.app)

This dashboard is a quantitative diversity auditor for egocentric robot-training data (the EgoVerse dataset). It lets you pick two dataset subsets, ranks them on three independent signals, and rolls them into a single Composite Diversity Index. An AI-generated narration explains the result in plain language, with optional ElevenLabs voice playback.

## What it does

1. **Pick two subsets to compare** — choose any pair of scored datasets (e.g. an unfiltered random draw vs. a curated stratified draw, or a single-scene control vs. a long-tail boosted collection).
2. **Measure three diversity signals** — for each subset the app computes:
   - **Visual diversity** — a Vendi Score over DINOv3 frame embeddings. Higher means the frames cover more distinct visual situations.
   - **Metadata coverage** — normalized Shannon entropy across scene, task, object, and demonstrator labels. Higher means the labels are more evenly distributed.
   - **Motion signature** — a Vendi Score over movement descriptors. Higher means the subset contains more varied physical motion.
3. **Combine into a Composite Diversity Index** — a weighted aggregate that ranks the two subsets on a single 0–100 scale.
4. **Sanity-check the metric** — a built-in harness constructs three subsets with a known diversity order and verifies the metric reproduces that order.
5. **Narrate the result** — an LLM writes a short, plain-language summary naming the selected datasets, explaining each metric, and describing why the diversity delta matters. ElevenLabs can read it aloud with an expressive voice.

## Why it matters

Robot-learning models generalize better when trained on diverse data. Without measurement, a dataset can quietly collapse onto a few dominant scenes, tasks, or demonstrators, causing the model to overfit to those. This tool turns "is our data diverse?" from a gut feeling into a reproducible number, so teams can prove which collection strategy actually produces better training data. The LLM never scores anything — it only narrates the precomputed math.

## Integrations

- **Lovable AI Gateway** — generates the plain-language narration.
- **ElevenLabs** — converts the narration into spoken audio.
- **Modal** — optional GPU backend for heavy embedding / Vendi compute (the demo uses deterministic precomputed metrics).

## Development

This project was built with [Lovable](https://lovable.dev).

Continue developing it in the [Lovable editor](https://lovable.dev/projects/9334d081-9e03-4a1a-ad6c-7709c49d5ed2).

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## EgoVerse Hackathon · Track 2 Pitch

> A quantitative diversity auditor for egocentric robot-training data — ranks dataset subsets so "is our data diverse?" stops being a guess.

### Three signals, one index

- **Visual Diversity** — Vendi Score over DINOv3 frame embeddings. Higher means the frames cover more distinct visual situations.
- **Metadata Coverage** — normalized Shannon entropy across scene, task, object, and demonstrator labels. Higher means the labels are more evenly distributed.
- **Motion Signature** — Vendi Score over movement descriptors. Higher means the subset contains more varied physical motion.

These three signals roll into a single **Composite Diversity Index** so teams can compare collection strategies on a clean 0–100 scale.

### Built-in trust

- **Sanity-checked ranking harness** — constructs subsets with a known diversity order and verifies the metric reproduces that order.
- **LLM narrates only — never scores** — the AI explains the precomputed math in plain (or Gen Z) language; it does not influence the numbers.

## Tech Stack

| Layer | Tools |
| --- | --- |
| **Frontend** | TanStack Start v1 (React 19 + Vite 7), Tailwind CSS v4, shadcn/ui, TypeScript |
| **Backend** | `createServerFn` server functions, Lovable AI Gateway for LLM calls |
| **AI & Voice** | ElevenLabs text-to-speech narration |
| **Deployment** | Lovable Cloud / Cloudflare Workers |
