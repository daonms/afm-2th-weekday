# Skill: Design Brief

## Purpose

Turn a rough Korean request into a clear design brief before any screen is built.

## Use When

- The student says only a mood, brand, target, or vague page idea.
- The project has no `DESIGN.md`.
- The agent is about to generate a UI but the intent is still fuzzy.

## Inputs

- Project type: single HTML, React/Vite, or Turborepo artifact
- Target user
- Desired mood
- Required content
- Constraints such as Korean font, dark mode, or no external assets

## Process

1. Write the design goal in one sentence.
2. Identify the artifact type: page, dashboard, card, poster, or system page.
3. Choose one primary visual direction and one fallback.
4. List required reusable decisions: colors, fonts, spacing, components, assets.
5. Define what must be reviewed before implementation.

## Output

```text
Design intent:

Audience:

Artifact:

Visual direction:

Reusable decisions needed:

Review checklist:
```

## Classroom Rule

If the brief cannot explain why the design should look this way, do not build yet.

