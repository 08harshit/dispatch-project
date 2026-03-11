# Production Readiness Checklist

## Completed

- **Environment variables:** Documented in `.env.example`. No secrets in code.
- **Health/readiness:** `GET /api/health` pings the database. Returns 503 when unhealthy.
- **Graceful shutdown:** SIGTERM/SIGINT handlers close the server and exit.
- **Error handler:** Returns generic "Internal Server Error" for 5xx in production. No stack traces to client.
- **Logging:** Structured logger (pino). Debug level in development, info in production.
- **Security:** Helmet, CORS, rate limiting. Auth middleware on protected routes. Validation (zod) on key endpoints.
- **RBAC:** `requireRole` middleware available in `middleware/auth.ts`. Enable per-route when needed.

## Recommendations

- **API versioning:** Consider `/api/v1/` prefix for future breaking changes.
- **Secrets:** Use a secrets manager (e.g. Vault, AWS Secrets Manager) in production.
- **Monitoring:** Add APM (e.g. Datadog, New Relic) and alerting.
- **Database:** Ensure Supabase connection pooling and backups are configured.
