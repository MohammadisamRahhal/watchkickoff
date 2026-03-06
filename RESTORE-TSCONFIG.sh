#!/usr/bin/env bash
# Run from the monorepo root to restore all TypeScript configuration files.
# Safe to run multiple times — overwrites only the four config files.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Restoring TypeScript config from monorepo root: $ROOT"

# ── 1. tsconfig.base.json ────────────────────────────────────────
cat > "$ROOT/tsconfig.base.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "exactOptionalPropertyTypes": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  }
}
EOF
echo "  ✓ tsconfig.base.json"

# ── 2. packages/shared/tsconfig.json ────────────────────────────
cat > "$ROOT/packages/shared/tsconfig.json" << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
echo "  ✓ packages/shared/tsconfig.json"

# ── 3. packages/shared/src/index.ts ─────────────────────────────
cat > "$ROOT/packages/shared/src/index.ts" << 'EOF'
/**
 * @watchkickoff/shared
 *
 * Single source of truth for:
 * - Zod schemas (runtime validation + TypeScript inference)
 * - Inferred TypeScript types
 * - Domain constants (MatchStatus, EventType)
 *
 * Consumed by both apps/api and apps/web.
 * Never import from sub-paths — always import from '@watchkickoff/shared'.
 */
export * from './schemas/index.js';
export * from './types/index.js';
export * from './constants/index.js';
EOF
echo "  ✓ packages/shared/src/index.ts"

# ── 4. apps/api/tsconfig.json ───────────────────────────────────
cat > "$ROOT/apps/api/tsconfig.json" << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@config/*":         ["config/*"],
      "@core/*":           ["core/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@modules/*":        ["modules/*"],
      "@providers/*":      ["providers/*"],
      "@jobs/*":           ["jobs/*"]
    }
  },
  "references": [
    { "path": "../../packages/shared" }
  ],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
echo "  ✓ apps/api/tsconfig.json"

# ── 5. apps/web/tsconfig.json ───────────────────────────────────
cat > "$ROOT/apps/web/tsconfig.json" << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "noEmit": true,
    "paths": {
      "@watchkickoff/shared": ["../../packages/shared/src/index.ts"],
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "next.config.mjs"],
  "exclude": ["node_modules", ".next"]
}
EOF
echo "  ✓ apps/web/tsconfig.json"

echo ""
echo "All TypeScript config files restored."
echo ""
echo "Build order:"
echo "  1.  cd \$ROOT && npm install"
echo "  2.  npm run build --workspace=packages/shared"
echo "  3.  npm run build --workspace=apps/api"
echo "  4.  cd apps/web && npx next build"
