# Plan: Add Branch Safeguard to team-implement

## Context

`/team-implement` Phase 3 creates a feature branch, but has no safeguard to check if we're already on main or on an existing feature branch. Need to add a check that prevents working directly on main.

## Change

Edit `.claude/skills/team-implement/SKILL.md` Phase 3 to add a branch check:

```markdown
### Phase 3: Branch Creation

Before any work begins, ensure we're on a feature branch — never work directly on main.

1. Check current branch: `git branch --show-current`
2. If on `main`:
   - Create and switch to a feature branch: `git checkout -b feat/{feature-slug}`
3. If already on a feature branch (`feat/`, `fix/`, `refactor/`, `chore/`):
   - Use the existing branch
4. If on an unexpected branch:
   - Ask the user via AskUserQuestion whether to use it or create a new one
```

## Verification

Read the updated file and confirm Phase 3 includes the branch check logic.
