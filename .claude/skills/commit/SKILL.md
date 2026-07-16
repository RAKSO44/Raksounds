---
name: commit
description: Create well-formed git commits for this repo — Conventional Commits format, English, bulleted body, and splitting unrelated changes into separate commits.
---

# Commit standard (Raksound)

## Format

```
<type>(<scope>): <subject>

- <bullet describing a concrete change>
- <bullet describing a concrete change>
```

- **Language: English**, always (subject and body).
- **Subject**: imperative mood ("add", not "added"/"adds"), lowercase after the
  colon, no trailing period, ≤ 72 characters.
- **Body**: bullet list (`- `), one concrete change per bullet. Explain *what*
  and, when not obvious, *why*. Skip the body only for trivial one-line changes.
- End every commit message with:
  `Co-Authored-By: Claude <model name> <noreply@anthropic.com>` when Claude
  authored the changes.

## Types

| Type | Use for |
|---|---|
| `feat` | New user-facing or domain capability |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `test` | Tests only |
| `docs` | READMEs, comments, docs/ |
| `chore` | Tooling, config, rules, skills, dependencies |
| `build` | Native build, app.json, Expo config |

## Scopes

Use the architecture layer or feature as scope: `domain`, `audio`,
`library`, `home`, `profile`, `app`, `theme`, `design-system`, `rules`,
`skills`, `deps`. Omit the scope only when the change is truly cross-cutting.

## When to split into multiple commits

Split when the staged work mixes any of these:

1. **Different types** — e.g. a new feature + unrelated tooling → `feat` + `chore`.
2. **Different layers with independent value** — domain logic vs UI that
   consumes it can be one commit if built together for one purpose; split if
   either stands alone.
3. **Dependency bumps / lockfile churn** unrelated to the feature.
4. **Reformatting or renames** mixed with logic changes — always separate.

Rule of thumb: if the subject line needs "and" joining unrelated things,
split. Stage selectively with `git add <paths>` per commit.

## Checklist before committing

1. `npx jest && npx tsc --noEmit && npx eslint src` pass clean.
2. `git status` reviewed — no unintended files (build output, secrets, temp).
3. Each commit compiles and passes tests on its own.
