# BRIDGE Frontier Upgrade Plan

## Current State Assessment
- **Stack**: Vite 8 + React 19 + TypeScript + Express + Tailwind 4 + PWA
- **Architecture**: SPA with Express backend (serverless on Vercel)
- **Data**: File-based JSON + localStorage cache + Google Sheets sync
- **AI**: Gemini API (chat, OCR, transcription, suggestions)
- **Modules**: 8 modules (home, todo, slips, budget, proxy, consensus, flows, arcade)

---

## Frontier Upgrade Categories

### 1. Modern React Architecture (React 19)
- [ ] Migrate to React 19 concurrent features: `useOptimistic`, `useActionState`, `use`
- [ ] Implement `React Server Components` pattern with Vite SSR
- [ ] Add `Suspense` boundaries for streaming
- [ ] Use `use` hook for async data in components
- [ ] Implement `useOptimistic` for instant UI updates

### 2. Security Hardening (Production-Grade)
- [ ] Content Security Policy with nonces
- [ ] Security headers (HSTS, X-Frame-Options, Permissions-Policy)
- [ ] Rate limiting on API endpoints
- [ ] Input validation with Zod schemas
- [ ] CSRF protection for state-changing operations
- [ ] Secure cookie/session handling

### 3. Performance & Edge Optimization
- [ ] Code splitting with dynamic imports per module
- [ ] Streaming SSR with Vite
- [ ] Edge function deployment (Vercel Edge Runtime)
- [ ] Optimized bundle analysis
- [ ] Image optimization (WebP/AVIF)
- [ ] Font optimization (self-hosted, preload)
- [ ] Service Worker precaching strategy

### 4. Type-Safe API Layer
- [ ] tRPC or similar for end-to-end type safety
- [ ] OpenAPI/Swagger generation
- [ ] API versioning strategy
- [ ] Request/response validation middleware

### 5. Data Layer Modernization
- [ ] IndexedDB (Dexie.js) for offline-first persistence
- [ ] Sync engine with conflict resolution (CRDT or operational transform)
- [ ] Real-time sync via Server-Sent Events or WebSockets
- [ ] Supabase/PostgreSQL backend option
- [ ] Database migrations system

### 6. AI/ML Enhancement
- [ ] Local LLM gateway integration (FreeLLMAPI/LiteLLM)
- [ ] Streaming AI responses (Server-Sent Events)
- [ ] Function calling / tool use for AI
- [ ] RAG over personal data (tasks, slips, budget)
- [ ] Multi-modal support (vision, audio)

### 7. Observability & Reliability
- [ ] Structured logging (Pino/Winston)
- [ ] Error boundaries with Sentry integration
- [ ] Performance monitoring (Web Vitals)
- [ ] Health check endpoints
- [ ] Distributed tracing

### 8. PWA & Mobile Excellence
- [ ] Background sync for offline mutations
- [ ] Periodic background sync
- [ ] Push notifications (Web Push API)
- [ ] Better install prompts
- [ ] App shortcuts

### 9. Developer Experience
- [ ] Vitest + React Testing Library
- [ ] Playwright E2E tests
- [ ] Storybook for component library
- [ ] CI/CD with GitHub Actions
- [ ] Pre-commit hooks (husky + lint-staged)

### 10. Design System & Accessibility
- [ ] Design tokens (via design-md skill)
- [ ] Component library with variants
- [ ] WCAG 2.1 AA compliance
- [ ] Dark mode support
- [ ] Motion reduction preferences

---

## Implementation Priority (Frontier MVP)

### Phase 1: Foundation (Week 1)
1. Security headers + CSP
2. Rate limiting
3. Input validation (Zod)
4. Type-safe API layer (tRPC)

### Phase 2: React 19 Modernization (Week 2)
1. Concurrent features migration
2. Code splitting per module
3. Suspense boundaries
4. useOptimistic for mutations

### Phase 3: Data & Sync (Week 3)
1. IndexedDB offline layer
2. Sync engine with conflict resolution
3. Real-time updates (SSE)

### Phase 4: AI Enhancement (Week 4)
1. Local LLM gateway
2. Streaming responses
3. Function calling
4. RAG implementation

### Phase 5: Observability & Polish (Week 5)
1. Error boundaries + Sentry
2. Web Vitals monitoring
3. PWA enhancements
4. Accessibility audit

---

## Key Technical Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| API Layer | tRPC v11 | Full type safety, React integration, minimal boilerplate |
| Validation | Zod + tRPC | Schema-first, inference, composability |
| State | TanStack Query + React 19 | Server state + optimistic updates |
| Offline | Dexie.js (IndexedDB) | Mature, reactive, TypeScript-first |
| Real-time | SSE (Vercel compatible) | Simpler than WebSockets, works on Edge |
| AI Gateway | FreeLLMAPI (native) | No Docker overhead, unified API |
| Logging | Pino | Fast, structured, Edge-compatible |
| Testing | Vitest + Playwright | Fast, modern, good DX |
| CI/CD | GitHub Actions | Native, free, integrated |

---

## Environment Variables Needed

```bash
# Security
ENCRYPTION_KEY=          # 32-byte hex for data encryption
CSRF_SECRET=             # For CSRF token signing

# Database (optional - Supabase)
DATABASE_URL=            # PostgreSQL connection string
SUPABASE_URL=            # Supabase project URL
SUPABASE_ANON_KEY=       # Supabase anon key
SUPABASE_SERVICE_ROLE=   # Supabase service role key

# AI
GEMINI_API_KEY=          # Google Gemini API key
FREELLAPI_URL=           # Local FreeLLMAPI endpoint
FREELLAPI_KEY=           # FreeLLMAPI unified key

# Monitoring
SENTRY_DSN=              # Sentry DSN for error tracking
VERCEL_ANALYTICS_ID=     # Vercel Analytics

# Sync
GOOGLE_CLIENT_ID=        # Google OAuth client ID
GOOGLE_CLIENT_SECRET=    # Google OAuth client secret
```

---

## File Structure (Target)

```
BRIDGE/
├── api/                          # Vercel serverless functions
│   ├── index.ts                  # Main entry (tRPC + Express)
│   ├── trpc/                     # tRPC routers
│   │   ├── routers/
│   │   │   ├── tasks.ts
│   │   │   ├── slips.ts
│   │   │   ├── budget.ts
│   │   │   ├── proxy.ts
│   │   │   ├── consensus.ts
│   │   │   ├── flows.ts
│   │   │   ├── ai.ts
│   │   │   └── sync.ts
│   │   ├── context.ts
│   │   └── trpc.ts
│   ├── middleware/
│   │   ├── rateLimit.ts
│   │   ├── validation.ts
│   │   ├── security.ts
│   │   └── auth.ts
│   └── package.json
├── src/
│   ├── components/
│   │   ├── ui/                   # Design system components
│   │   ├── modules/              # Feature modules (lazy loaded)
│   │   ├── layout/
│   │   └── common/
│   ├── hooks/
│   │   ├── useOptimisticMutation.ts
│   │   ├── useStreamingAI.ts
│   │   └── useOfflineSync.ts
│   ├── lib/
│   │   ├── trpc/
│   │   │   ├── client.ts
│   │   │   ├── queryClient.ts
│   │   │   └── react.tsx
│   │   ├── db/
│   │   │   ├── index.ts          # Dexie.js setup
│   │   │   ├── schema.ts
│   │   │   └── sync.ts
│   │   ├── ai/
│   │   │   ├── gateway.ts        # FreeLLMAPI client
│   │   │   ├── streaming.ts      # SSE streaming
│   │   │   ├── tools.ts          # Function calling
│   │   │   └── rag.ts            # RAG implementation
│   │   ├── security/
│   │   │   ├── csp.ts
│   │   │   ├── headers.ts
│   │   │   └── rateLimit.ts
│   │   ├── logging/
│   │   │   └── logger.ts
│   │   └── utils/
│   ├── types/
│   │   ├── api.ts                # tRPC inferred types
│   │   └── index.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── tokens.css            # Design tokens
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx                # Route definitions with lazy loading
├── vercel.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── .github/workflows/
    ├── ci.yml
    └── deploy.yml
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse Performance | ≥ 95 |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| Bundle Size (initial JS) | < 100 KB gzipped |
| Time to Interactive | < 2s (3G) |
| First Contentful Paint | < 1s |
| Cumulative Layout Shift | < 0.1 |
| API Response Time (p95) | < 200ms |
| Offline Functionality | 100% core features |
| Test Coverage | ≥ 80% |
| TypeScript Strict | 0 errors |

---

## Next Immediate Actions

1. **Install security dependencies**: `helmet`, `zod`, `tRPC`, `@tanstack/react-query`
2. **Create `vercel.json` with security headers**
3. **Add tRPC server setup**
4. **Implement CSP middleware with nonces**
5. **Add rate limiting middleware**
6. **Create Zod schemas for all API inputs**
7. **Migrate Express routes to tRPC procedures**
8. **Add React Query provider**
9. **Implement useOptimistic for mutations**
10. **Add Dexie.js for offline-first**