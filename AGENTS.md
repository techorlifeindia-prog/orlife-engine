# AI Project Constitution Version 1.0

**Vision:** High-performance, secure, scalable, and modular AI Hub + WhatsApp + Website that is production-ready.

- **Rule 1:** Performance First – Lightweight code, no unnecessary libraries, low response time, memory efficient.
- **Rule 2:** Tech Stack is Fixed: Frontend uses Next.js (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query, Lucide. Backend uses Node.js + Fastify + TypeScript. DB is PostgreSQL; Cache is Redis. WhatsApp Engine: Baileys. Deployment: Nginx, PM2 (Docker optional).
- **Rule 3:** Clean Architecture – Modular and reusable, strictly no duplicate code.
- **Rule 4:** Strict TypeScript, clear folder structure, meaningful naming conventions.
- **Rule 5:** Security – Cover basics: environment variables, input validation, SQL Injection prevention, XSS, CSRF.
- **Rule 6:** API Standards – Consistent response formats, clear HTTP status codes, robust error handling.
- **Rule 7:** DB – Use indexes, transactions, avoid N+1 queries, optimize slow queries.
- **Rule 8:** Redis is for justified use cases only; always set clear expiry (TTL).
- **Rule 9:** Frontend – Responsive, accessible, lazy-loading, reusable components.
- **Rule 10:** WhatsApp – Stable Baileys setup, auto-reconnect, safe session storage.
- **Rule 11:** Logging – Log properly but NEVER log sensitive data (No PII).
- **Rule 12:** Testing – Test every feature and edge cases; "Done" means "Tested".
- **Rule 13:** Documentation – Keep documentation alongside every module.
- **Rule 14:** Git Discipline – Clear commits, explicitly note breaking changes.
- **Rule 15:** AI Working Protocol – Do not guess; if there is no clarity, ask questions; provide options first before implementing.
- **Rule 16:** No new packages, architectural shifts, or breaking DB changes without explicit user approval.
- **Rule 17:** Performance Optimization – Implement pagination, caching, debouncing, and lazy loading where applicable.
- **Rule 18:** Error Handling – User-friendly error messages on the frontend, detailed technical logs on the backend.
- **Rule 19:** Final Checklist – Build passes, no type/runtime errors, documentation is updated, code is production-ready.

**Golden Rule:** Correctness, Security, Performance, Stability, Clean Code – strictly in this exact priority order.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 📌 PROJECT STATUS & ROADMAP TRACKING
- **Master Progress File:** PROJECT_STATUS.md
- **Rule for AI Agents:** Always read PROJECT_STATUS.md at the start of a conversation to verify completed tasks [x] vs pending tasks [ ]. Update PROJECT_STATUS.md whenever a phase or major task is completed.
