# Skill: Brand Media

## Purpose

Reuse the design system for business cards, posters, thumbnails, and dark-mode artifacts.

## Use When

- Project 3 begins.
- A Turborepo or shared package should reuse design tokens.
- The output includes business card, poster, hero image, or social thumbnail.
- Image generation is needed for visual assets.

## Process

1. Confirm the shared tokens from `DESIGN.md`.
2. Define artifact sizes and safe areas.
3. Generate image prompts for backgrounds or visual motifs only.
4. Place important Korean text with HTML/CSS or design tool text layers.
5. Produce light and dark variants from the same token set.
6. Record any new asset rules back into `DESIGN.md`.

## OpenAI Image Prompt Template

```text
Create a [background / poster visual / card visual] for the AFM Classroom design system.
Mood: calm Korean workshop tool, warm paper, clear operational hierarchy.
Palette: canvas #F7F4EE, ink #1D1B18, focus blue #2563EB, signal green #168A5B.
Do not include readable Korean text.
Leave clean negative space for HTML/CSS text overlay.
Aspect ratio: [size].
```

## Claude Design Use

Use Claude Design for visual exploration, inline critique, and applying a connected team design system when access is available. Export or hand off the result only after updating repo files.

## Classroom Rule

Media output is proof that the system repeats. If card and poster feel unrelated, the system is not strong enough yet.
