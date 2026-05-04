# Recommended Design Skills

This file combines the class workflow with current open-source references found on GitHub and official product notes checked on 2026-05-04.

## Project 1 - Single HTML Page

Recommended external references:

1. `jeffrschneider/weblet`
   - Best fit for `APP.md + index.html` agent-native static UI.
   - Use when students need a self-contained UI that opens directly in the browser.
2. `zarazhangrui/frontend-slides`
   - Best fit for single HTML outputs with inline CSS/JS and strong visual direction.
   - Use when the output is a presentation, poster-like page, or classroom artifact.
3. `anthropics/claude-code/plugins/frontend-design`
   - Best fit for stronger frontend taste and bolder typography/color decisions.
   - Use when the first HTML looks too generic and needs visual polish.

Local skill route:

- Start with `skills/01-design-brief`
- Then `skills/03-design-system`
- Then `skills/04-single-html`
- End with `skills/07-design-review`

## Project 2 - Vite + React Design System

Recommended external references:

1. `google-labs-code/design.md`
   - Best fit for DESIGN.md as a portable visual identity specification.
   - Use as the reference shape for token and rule documentation.
2. `VoltAgent/awesome-design-md`
   - Best fit for comparing existing DESIGN.md examples from recognizable sites.
   - Use when students need inspiration or a starting style direction.
3. `google-labs-code/stitch-skills`
   - Best fit for Stitch-style prompt enhancement and design system synthesis.
   - Use when moving from visual exploration to structured design docs.

Local skill route:

- Start with `skills/02-visual-research`
- Then `skills/03-design-system`
- Then `skills/05-react-vite`
- End with `skills/07-design-review`

## Project 3 - Turborepo, Business Card, Poster, Dark Mode

Recommended external references:

1. `CopilotKit/OpenGenerativeUI`
   - Best fit for design-system-backed generative UI and MCP-style HTML assembly.
   - Use when the class wants to discuss agent-driven UI beyond one page.
2. `tw93/kami`
   - Best fit for document, poster, one-pager, and slide-like layout constraints.
   - Use when students need a strict visual language that repeats across artifacts.
3. `heygen-com/hyperframes`
   - Best fit for HTML/CSS/JS compositions that can become rendered media.
   - Use when posters, motion cards, or video-like outputs enter the workflow.

Local skill route:

- Start with `skills/03-design-system`
- Then `skills/06-brand-media`
- For app surfaces, add `skills/05-react-vite`
- End with `skills/07-design-review`

## Image Generation Recommendation

Use OpenAI `gpt-image-2`, not the informal spelling `gpt imege2.0`.

Good uses:

- mood-board thumbnails
- background imagery
- poster/card visual concepts
- product mockup assets
- image editing and style variants

Avoid:

- relying on generated Korean text
- treating image output as final design tokens
- embedding generated visual decisions without updating `DESIGN.md`

Operational note:

- OpenAI official docs list `gpt-image-2` as the latest GPT Image model for generation and editing.
- GPT Image models may require API organization verification.

## Claude Design Recommendation

Claude Design is usable if the account has access. Anthropic describes it as a Claude Labs product for visual work, conversation-based refinement, inline comments, direct edits, and applying a team's design system when connected.

Best uses:

- exploring 2-3 directions before coding
- refining a screen with comments
- applying an existing design system to multiple screens
- handoff to external tools such as Canva when that workflow is available

Classroom caution:

- Treat Claude Design as a visual ideation and review tool.
- Keep the durable source of truth in repo files: `DESIGN.md`, `AGENTS.md`, and `skills/*/SKILL.md`.

## Quick Decision Matrix

| Need | Best tool |
|---|---|
| One-file browser demo | Weblet pattern + local `04-single-html` |
| Repeatable visual identity | DESIGN.md + local `03-design-system` |
| UI taste boost | frontend-design style skill |
| Korean font/poster exploration | `gpt-image-2` for backgrounds, CSS for text |
| Visual design workspace | Claude Design if access is available |
| Reusable packages | Turborepo + local `06-brand-media` |
