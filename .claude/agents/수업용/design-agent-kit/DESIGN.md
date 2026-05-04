# DESIGN.md - AFM Classroom Design System

## 1. Visual Theme

AFM Classroom projects should feel like calm Korean workshop tools: clear, operational, and slightly editorial. The UI should help students understand agent routing, design-system reuse, and project progression without feeling like a corporate admin dashboard.

Keywords: classroom studio, guided practice, agent routing, Korean typography, reusable design, quiet confidence.

Avoid: generic AI SaaS gradients, overly glossy cards, random illustration blobs, decorative English-first typography.

## 2. Color Palette

| Token | Hex | Role |
|---|---:|---|
| `canvas` | `#F7F4EE` | page background, warm classroom paper |
| `surface` | `#FFFFFF` | panels, cards, editable areas |
| `surface-muted` | `#EFE9DF` | secondary blocks, code examples |
| `ink` | `#1D1B18` | primary Korean text |
| `ink-soft` | `#5E574D` | supporting text |
| `line` | `#D8CEC0` | borders and separators |
| `focus-blue` | `#2563EB` | selected state, links, keyboard focus |
| `signal-green` | `#168A5B` | approved, reusable, verified |
| `signal-amber` | `#B7791F` | draft, needs review |
| `signal-red` | `#B42318` | risk, blocked, invalid |
| `dark-canvas` | `#14110E` | dark-mode background |
| `dark-surface` | `#211D18` | dark-mode cards |

## 3. Typography

| Use | Font | Rule |
|---|---|---|
| Korean UI | Pretendard Variable, Noto Sans KR, system-ui | default for app UI |
| Korean display option | Black Han Sans | use only for short titles or poster/card hero text |
| Code and tokens | JetBrains Mono, Consolas, monospace | use for file paths, token names, command examples |

Scale:

- Page title: 32px / 1.2 / 700
- Section title: 22px / 1.3 / 700
- Card title: 17px / 1.35 / 700
- Body: 15-16px / 1.7 / 400
- Caption: 13px / 1.55 / 500
- Token/code: 13px / 1.5 / 500

Korean body text should never be compressed below 15px.

## 4. Spacing And Radius

- Base spacing unit: 8px
- Tight group: 8-12px
- Card padding: 20-24px
- Section gap: 32-48px
- Page max width: 1120px for app screens, 900px for docs
- Radius small: 6px
- Radius card: 8px
- Radius pill: 999px only for labels and segmented controls

## 5. Components

Buttons:

- Primary: `focus-blue` background, white text, 8px radius
- Secondary: white background, `line` border, `ink` text
- Destructive: `signal-red` background only when action is destructive

Cards:

- White or dark surface
- 1px border
- Soft shadow only: `0 8px 24px rgba(29, 27, 24, 0.08)`
- Do not nest card inside card unless it is a modal or repeated item.

Skill cards:

- Must show skill name, trigger, input, output, and review rule.
- Use status labels: `draft`, `usable`, `verified`.

Design token tables:

- Always include token name, value, role, and usage warning.
- Use monospace for token names and hex values.

## 6. Layout Principles

- Single HTML prototype: one first screen with all controls visible enough for classroom demo.
- React/Vite project: separate pages for `Design System`, `Components`, and `Examples`.
- Turborepo project: tokens live in a shared package; business card and poster consume the same tokens.
- Mobile-first layout starts at 375px.
- Dense learning tools are acceptable, but sections must remain scannable.

## 7. Image And Asset Rules

- Use generated images for mood boards, poster backgrounds, thumbnails, profile marks, and card/poster visual variants.
- Do not let generated images override `DESIGN.md` token choices.
- Keep asset prompts tied to token names, font choices, and layout use.
- For Korean typography, generate backgrounds separately from text when possible; place Korean text in HTML/CSS for accuracy.

## 8. Dark Mode

Dark mode should preserve the classroom-tool identity, not become neon cyberpunk.

- Background: `dark-canvas`
- Surface: `dark-surface`
- Text: `#F5F0E8`
- Muted text: `#B9AEA0`
- Border: `#3B332B`
- Focus remains `focus-blue`, but reduce large blue areas.

## 9. Agent Prompt Guide

Use this when asking an AI agent to design or build:

```text
Use the AFM Classroom DESIGN.md as the source of truth.
Build for Korean UI first.
Keep the layout calm, operational, and classroom-readable.
Avoid generic AI SaaS styling.
If an image is needed, generate the image as an asset only; keep Korean text in HTML/CSS.
Return the result with design intent, reusable system decisions, build target, and review checklist.
```
