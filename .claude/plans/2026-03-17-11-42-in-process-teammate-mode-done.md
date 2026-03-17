# Force In-Process Teammate Mode

## Context
All team-* skills currently spawn agents in split-pane mode (tmux/iTerm2 tabs) because `teammateMode` is set to `"auto"`. User wants all agents to run in-place within the main terminal instead.

## Change
**File:** `.claude/settings.json` (line 23)

```diff
- "teammateMode": "auto",
+ "teammateMode": "in-process",
```

That's it. One line. No agent or skill files need modification — `teammateMode` is the single global control point for all agent team display behavior.

## How it works
- `"auto"` — uses split panes if tmux/iTerm2 detected, in-process otherwise
- `"in-process"` — forces all teammates to run inside the main terminal (cycle with Shift+Down)
- `"tmux"` — forces split-pane mode

## Verification
1. Change the setting
2. Run any team skill (e.g., `/team-plan "test"`) and confirm agents spawn in-place, not in separate panes
