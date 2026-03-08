# TypeScript Style Guide - Harbangan Frontend

## Tooling

- **TypeScript** 5.9 with strict mode (`noUnusedLocals`, `noUnusedParameters`, `strict`)
- **ESLint** 9 with `typescript-eslint` recommended rules + React hooks + React Refresh
- **Vite** 7 for builds and dev server
- Target: ES2022, module: ESNext, bundler resolution

Run before committing:
```bash
npm run lint    # eslint
npm run build   # tsc -b && vite build
```

## Imports

- Use `verbatimModuleSyntax` - always use `import type` for type-only imports
- Order: React/external libs first, then internal modules

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import type { UserInfo } from '../lib/api';
import { apiFetch } from '../lib/api';
import { authHeaders } from '../lib/auth';
```

## Components

- **Named exports** for all components: `export function MetricCard() {}`
- **Default export** only for `App.tsx`
- Props defined with `interface`, not `type`:

```typescript
interface MetricCardProps {
  label: string;
  value: number;
  unit?: string;
}

export function MetricCard({ label, value, unit }: MetricCardProps) {
  // ...
}
```

## File Organization

```
src/
  pages/        → Route-level components (Dashboard, Profile, Login, etc.)
  components/   → Reusable components (Sidebar, SessionGate, ApiKeyManager, etc.)
  lib/          → Utilities (api.ts, auth.ts, useSSE.ts)
  styles/       → CSS files (variables.css, global.css, components.css)
```

## State Management

- Use `useState` / `useEffect` directly - no state management library
- Custom hooks for shared logic (e.g., `useSSE` for real-time data)
- No Context API unless truly needed for deep prop drilling

## Styling

- Plain CSS with custom properties from `variables.css`
- Use `className` with classes from `components.css`
- **No inline styles** unless dynamically computed
- Use existing CSS variables:

```css
var(--bg)        /* background */
var(--surface)   /* card/panel background */
var(--green)     /* primary accent */
var(--text)      /* body text */
var(--glow-sm)   /* subtle glow effect */
var(--font-mono) /* JetBrains Mono */
var(--radius)    /* 2px border radius */
```

## API Calls

- All API calls go through `apiFetch()` from `src/lib/api.ts`
- Base path: `/_ui/api`
- Auth headers via `authHeaders()` from `src/lib/auth.ts`
- SSE connections use `useSSE` hook with `withCredentials: true`

```typescript
const data = await apiFetch<MetricsData>('/metrics');
```

## TypeScript Conventions

- Strict mode: no unused variables or parameters
- Prefer `interface` over `type` for object shapes
- Use `import type` for type-only imports (enforced by `verbatimModuleSyntax`)
- Avoid `any` - use `unknown` and narrow with type guards
- Prefer `const` over `let`; never use `var`

## Testing (Playwright E2E)

- Test files: `e2e/specs/*.spec.ts`
- Three test suites: `public` (unauthenticated), `authenticated`, `admin`
- Session state in `e2e/.auth/session.json`
- Setup via `npm run test:e2e:setup` (interactive browser session capture)
- Run: `npm run test:e2e`
