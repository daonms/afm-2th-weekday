# Skill: React Vite Design System

## Purpose

Convert a good single HTML result into a maintainable React/Vite project structure.

## Use When

- Project 2 begins.
- Components, pages, and design-system docs need separate files.
- Students need to understand why a design system lives outside one screen.

## Suggested Structure

```text
src/
├── design-system/
│   ├── tokens.ts
│   ├── typography.ts
│   └── components.md
├── components/
├── pages/
│   ├── DesignSystemPage.tsx
│   └── ExamplePage.tsx
└── App.tsx
```

## Process

1. Move token values from `DESIGN.md` into code constants.
2. Split repeated UI into components.
3. Create a design-system page with colors, typography, tokens, and components.
4. Preserve the single HTML visual direction.
5. Add dark-mode hooks only after light-mode tokens are stable.

## Output

```text
Created/updated files:
Components created:
Tokens mapped:
Design-system page contents:
Review checklist:
```

## Classroom Rule

Componentization should make reuse easier to see, not hide the lesson behind too many abstractions.

