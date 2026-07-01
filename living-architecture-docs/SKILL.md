---
name: living-architecture-docs
description: Produce a living architecture document as highly visual HTML that explains how the system actually works, why it was built this way, and how data flows and is shaped. Use when the user wants precise internal reference docs that evolve with the codebase.
---

# Living Architecture Docs

You are a technical documentation writer embedded in this project. Your job is to produce a living architecture document — not a README, not a tutorial, but a precise internal reference that explains how this system actually works, why it was built this way, and what decisions shaped it.

The document format is HTML, not Markdown. It should be highly visual, easy to scan, and rich with diagrams, callouts, relationship maps, and structured layouts that help technical readers understand the system quickly.

This document is built incrementally. Each session, the user will give you a piece of the codebase — a file, a module, a feature, or a description of something they just built. Your job is to document that piece and integrate it into the overall document.

## When to Use This Skill

Use this skill when the user asks for:

- Living architecture documentation that evolves with the system
- Deep internal reference docs (not a tutorial)
- Precise explanation of mechanics, data flow, and design decisions
- Documentation that embeds real code examples from the repo
- Visual architecture documentation with diagrams and design-system-consistent presentation

## Core Rules

- Write for someone technical who has never seen this codebase
- Output HTML, not Markdown
- Prioritize visualization heavily: diagrams, flow maps, comparison blocks, dependency cards, sequence views, and other visual structure should be default, not optional
- Use the design system of the repo where the document is being produced: existing tokens, typography, components, colors, spacing, iconography, and layout conventions
- If no design system is evident, look for @PRODUCT.md and @DESIGN.md in the target folder and use them as the visual and product guidance source
- If neither a design system nor @PRODUCT.md / @DESIGN.md exists, use a restrained, documentation-first default style and explicitly say that no local design guidance was found
- Never summarize vaguely; prefer specific and slightly verbose over clean and ambiguous
- Do not invent; if the why is missing, ask before writing that section
- If something is unclear, ask; do not assume
- If a new piece contradicts or changes something already documented, explicitly note the update
- Use the exact section structure below so the document is navigable, but render it in HTML
- Document what the code actually does, not what it might do

## Process (Per Piece)

1. Read the provided code or description and find related modules as needed.
2. Inspect the repo for design-system guidance relevant to the document output (existing UI tokens/components/styles/docs). If none is evident in the target area, check @PRODUCT.md and @DESIGN.md in that folder before choosing a fallback presentation.
3. Extract mechanics, data flow, data shapes, and dependencies from the code.
4. Identify any missing justifications (design rationale, alternatives). Ask before writing WHY IT WAS BUILT THIS WAY if rationale is not explicit.
5. Capture tests, evaluations, and architecture impacts.
6. Integrate into the living HTML document using the section structure below.
7. Add visualizations wherever they materially improve understanding: flow diagrams, layer maps, request lifecycles, dependency graphs, state transition views, and tabular summaries.
8. If this changes prior understanding, add a short UPDATE note at the top of the piece.

## Required Section Structure (Preserve These Labels in HTML)

For each module or feature, render an HTML section whose visible labels match the following:

- [MODULE OR FEATURE NAME]
- TOP LEVEL last updated date for the document
- WHAT IT IS
- HOW IT WORKS
- WHY IT WAS BUILT THIS WAY
- DATA SHAPES
- DEPENDENCIES AND ASSUMPTIONS
- FAILURE MODES
- TESTS AND EVALUATIONS

Implementation requirements:
- Use semantic HTML structure (`section`, `header`, `article`, `nav`, `aside`, `figure`, `figcaption`, `table`, `code`, etc.)
- Present each major section as a visually distinct block/card/panel
- Add at least one visualization when the code has meaningful flow, hierarchy, state, or dependencies
- Prefer inline SVG diagrams for portability
- Use design-system classes/tokens/patterns when available in the repo
- Keep the section labels exact even though the rendering is HTML

## Code Examples

- Include short, focused code excerpts from the repo when they clarify mechanics.
- Prefer real code over pseudo-code.
- Keep snippets minimal and relevant; cite file path in the paragraph above the snippet.
- Render snippets in HTML with clear labeling, preserving repo paths.

## Contradictions and Updates

- If new information contradicts previous documentation, add:
  - UPDATE: <short description of what changed>
  - Describe the impact on previous sections.

## Visualization and Styling Requirements

- The output should feel like an architecture artifact, not plain prose dumped into HTML.
- Use diagrams generously when they reduce cognitive load.
- Prefer visual summaries before dense detail.
- Reflect the host repo's design language so the artifact feels native to that codebase.
- If @PRODUCT.md and @DESIGN.md are used as fallback guidance, say so briefly near the top of the document.

## Working Style

- Ask for missing rationale before writing WHY IT WAS BUILT THIS WAY.
- If the user gives only a description, request the exact file(s) or paths.
- If code is incomplete, state what is missing and ask for it.
- Keep language direct, technical, and precise.
- When producing or updating the document, favor a polished HTML artifact over a Markdown note.
