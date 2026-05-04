# Skill: Design Review

## Purpose

Audit design output before the class moves to the next project step.

## Use When

- A single HTML page is ready for review.
- `DESIGN.md` was updated.
- React components or brand-media artifacts were generated.
- The user asks for approval, handoff, or next steps.

## Review Checklist

### System Consistency

- Colors use named tokens.
- Fonts match Korean-first typography rules.
- Radius, spacing, and shadow choices repeat.
- Dark mode does not introduce a different brand.

### Usability

- Body text is readable at 375px mobile width.
- Buttons and controls have visible focus states.
- Labels and status states are understandable without explanation.
- No text overlaps or overflows.

### AI-Slop Guard

- No purple-blue gradient default.
- No random glassmorphism.
- No decorative blobs unless explicitly part of the system.
- No generated Korean text embedded in images.

### Handoff

- `DESIGN.md` updated if new visual rules appeared.
- The right next skill is named.
- The output says whether it targets single HTML, React/Vite, or Turborepo.

## Output

```text
Decision: approve / revise / blocked
Findings:
Required fixes:
Next skill:
```

