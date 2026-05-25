---
name: vendor-repo
description: Add an external Git repository as a squashed subtree under repos/, inspect it, summarize what it is for, and update AGENTS.md and/or CLAUDE.md so coding agents know when and how to read it as reference material. Use when the user provides a Git repo they want vendored for agent reference, asks to add a reference repo, subtree a dependency, or make an external codebase available to coding agents.
---

# Vendor Reference Repo

Add an external Git repository to the current project as read-only reference material for coding agents.

This skill vendors the repository under `repos/` using `git subtree`, inspects what the repository is about, and updates agent instruction files so future agents know when to consult it.

## Inputs

The user should provide:

- A Git repository URL
- Optionally, a branch, tag, or commit
- Optionally, a desired local directory name under `repos/`

If the branch/ref is not provided, infer the default branch when possible.

## Process

1. Validate that the current directory is a Git repository.

2. Determine the vendored repo target:
   - Use the provided local name if given.
   - Otherwise derive a kebab-case name from the repository name.
   - Place it under `repos/<name>`.

3. Add the repository as a squashed Git subtree:

       git subtree add \
         --prefix=repos/<name> \
         <repo-url> \
         <branch-or-ref> \
         --squash

4. If `repos/<name>` already exists, update it instead:

       git subtree pull \
         --prefix=repos/<name> \
         <repo-url> \
         <branch-or-ref> \
         --squash

5. Inspect the vendored repository to understand what it is:
   - Read `README.md`, `docs/`, package manifests, examples, tests, and any agent-facing files such as `AGENTS.md`, `CLAUDE.md`, `LLMS.md`, or similar.
   - Identify the library, framework, tool, or application domain.
   - Identify when this repo should be consulted.
   - Identify any especially important files future agents should read first.

6. Update `AGENTS.md` and/or `CLAUDE.md`.

   - If either file exists, update each existing file.
   - If neither exists, create `AGENTS.md`.
   - Do not duplicate an existing vendored-repo section.
   - Do not treat files under `repos/` as application source.
   - Make clear that vendored repositories are read-only reference material.
   - Make clear that application code should not import from `repos/`.

7. Output a concise summary:
   - Repo added or updated
   - Local path
   - Ref used
   - What the repo appears to be about
   - Which instruction files were updated
   - Any recommended first-read files

## Agent instruction section

Add or update a section like this:

    ## Vendored repositories

    This project vendors external repositories under `repos/`.

    Use vendored repositories as read-only reference material when working with related libraries, frameworks, APIs, or implementation patterns.

    Rules:

    - Prefer patterns from vendored source code over guesses or web search when working with the related dependency.
    - Do not edit files under `repos/` unless explicitly asked.
    - Do not import from `repos/`; application code should import from normal package dependencies.
    - Do not treat `repos/` as application source.
    - If a vendored repo contains agent-facing files such as `AGENTS.md`, `CLAUDE.md`, `LLMS.md`, or similar, read those first when relevant.

    Vendored references:

    - `repos/<name>` — <short description>. Read this when <specific trigger>. Start with <important files>.

## Example instruction entries

For Effect:

    - `repos/effect` — Source code for Effect. Read this when writing or reviewing Effect code, especially APIs, schemas, layers, streams, errors, tests, or idiomatic module structure. Start with `LLMS.md`, `README.md`, examples, tests, and relevant package source.

For a UI library:

    - `repos/shadcn-ui` — Source code and examples for shadcn/ui. Read this when building or modifying UI components, styling conventions, component composition, or accessibility behavior. Start with `README.md`, examples, registry files, and component implementations.

For a framework:

    - `repos/nextjs` — Source code and examples for Next.js. Read this when working on routing, server components, app directory behavior, caching, rendering, or framework-specific conventions. Start with `README.md`, examples, docs, and relevant tests.

## Add editor configuration

Add or update `.vscode/settings.json` to reduce editor noise from vendored repos:

    {
      "typescript.preferences.autoImportFileExcludePatterns": [
        "repos/**"
      ],
      "javascript.preferences.autoImportFileExcludePatterns": [
        "repos/**"
      ],
      "files.exclude": {
        "repos/**": true
      },
      "files.watcherExclude": {
        "repos/**": true
      },
      "search.exclude": {
        "repos/**": true
      }
    }


## Rules

- Always use `git subtree`, not `git submodule`.
- Always use `--squash` unless the user explicitly asks to preserve full history.
- Keep all vendored repos under `repos/`.
- Treat vendored repos as reference material, not application code.
- Do not edit vendored repo files unless explicitly asked.
- Do not add imports from `repos/`.
- Prefer local vendored source over web search for dependency-specific implementation patterns.
- Keep `AGENTS.md` and `CLAUDE.md` updates minimal and practical.
- Include specific triggers for when to read each vendored repo.
- Include specific first-read files when they exist.
- Avoid vague entries like "read this repo when needed"; say exactly when it is relevant.

## Re-running

When invoked again:

1. If the same repo is already vendored, update it with `git subtree pull`.
2. Re-inspect the repository if files changed.
3. Refresh the corresponding `AGENTS.md` and/or `CLAUDE.md` entry.
4. Avoid duplicate entries.
5. Preserve any user-written project-specific guidance.
